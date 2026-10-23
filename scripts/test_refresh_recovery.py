"""Public publisher fallbacks and partial refresh outcomes; controlled transport."""
import copy
import datetime as dt
import io
import json
import os
import re
import tempfile
import unittest
from contextlib import redirect_stdout, ExitStack
from pathlib import Path
from unittest.mock import patch
import update_economic_data as m

FIXTURE=json.loads((m.ROOT/'data/economic-series.json').read_text())
# The EIA parser tests model the pre-refresh six-observation archive. The
# production snapshot is newer, but the recovery contract is unchanged.
FIXTURE['series']['BRENT']['observations']=[{'period':period,'value':value,'sourceURL':m.BRENT_EIA} for period,value in [
    ('2026-10-07',126.00),('2026-10-08',130.18),('2026-10-09',130.03),
    ('2026-10-12',129.95),('2026-10-13',125.78),('2026-10-14',126.55)]]
FIXTURE['series']['BRENT']['publishedAt']='2026-10-15'
EIA=b'<h1>Spot Prices</h1><p>Crude Oil in Dollars per Barrel, Products in Dollars per Gallon</p><table><tr><th>Product</th><th>10/07/26</th><th>10/08/26</th><th>10/09/26</th><th>10/12/26</th><th>10/13/26</th><th>10/14/26</th></tr><tr><td>WTI - Cushing, Oklahoma</td><td>1.00</td></tr><tr><td>Brent - Europe</td><td>126.00</td><td>130.18</td><td>130.03</td><td>129.95</td><td>125.78</td><td>126.55</td><td>1987-2026</td></tr></table><p>Release Date: 10/15/2026 Next Release Date: 10/21/2026</p>'

class RecoveryTests(unittest.TestCase):
    def test_eia_original_spot_brent_fallback_never_uses_wti(self):
        original=copy.deepcopy(FIXTURE['series']['BRENT'])
        def download(url):
            if url.startswith(m.BRENT):raise TimeoutError('controlled FRED read timeout')
            self.assertEqual(url,m.BRENT_EIA);return EIA
        with patch.object(m,'download',side_effect=download):result=m.refresh_brent(original,dt.date(2026,10,19))
        self.assertEqual(len(result['observations']),6)
        self.assertEqual(result['observations'][0]['period'],'2026-10-07')
        self.assertEqual(result['observations'][-1]['value'],126.55)
        self.assertEqual(result['observations'][-2]['value'],125.78)
        self.assertEqual(result['instrument'],'DCOILBRENTEU')
        self.assertEqual(result['modality'],'spot-Europe')
        self.assertEqual(result['unit'],'USD/bbl')
        self.assertEqual(result['publishedAt'],'2026-10-15')
        self.assertEqual(original,FIXTURE['series']['BRENT'])
        for raw in [EIA.replace(b'Crude Oil in Dollars per Barrel',b'Products in Dollars per Gallon'),EIA.replace(b'Brent - Europe',b'WTI'),EIA.replace(b'<td>126.55</td>',b''),EIA.replace(b'10/14/26',b'10/20/26')]:
            with self.assertRaises(ValueError):m.brent_eia_page(raw,original,dt.date(2026,10,19))
        with self.assertRaises(ValueError):m.brent_eia_page(re.sub(rb'<td>\d+\.\d+</td>',b'<td>-</td>',EIA),original,dt.date(2026,10,19))

    def test_eia_missing_report_is_not_zero_or_interpolated(self):
        previous=copy.deepcopy(FIXTURE['series']['BRENT']);previous['observations']=previous['observations'][:1]
        result=m.brent_eia_page(EIA.replace(b'>125.78<',b'>-<'),previous,dt.date(2026,10,19))
        self.assertNotIn('2026-10-13',[r['period'] for r in result['observations']])
        self.assertTrue(all(r['value']>0 for r in result['observations']))

    def test_eia_unpadded_dates_and_four_digit_year_are_valid(self):
        parsed=m.brent_eia_page(EIA.replace(b'10/07/26',b'10/7/2026').replace(b'Brent - Europe',b'Brent Europe'),FIXTURE['series']['BRENT'],dt.date(2026,10,19))
        self.assertEqual(parsed['observations'][-1]['value'],126.55)
        self.assertEqual(parsed['observations'][0]['period'],'2026-10-07')

    def test_eia_optional_cell_end_tags_keep_dates_and_values(self):
        raw=EIA.replace(b'</td>',b'').replace(b'</th>',b'')
        parsed=m.brent_eia_page(raw,FIXTURE['series']['BRENT'],dt.date(2026,10,19))
        self.assertEqual(len(parsed['observations']),6)
        self.assertEqual(parsed['observations'][0]['period'],'2026-10-07')
        self.assertEqual(parsed['observations'][-1]['value'],126.55)

    def test_eia_nested_label_table_keeps_outer_daily_price_columns(self):
        raw=EIA.replace(b'<th>Product</th>',b'<td><table><tr><td>Product by Area</td></tr></table></td>')
        raw=raw.replace(b'<td>Brent - Europe</td>',b'<td><table><tr><td><img src="indent.gif"></td><td class="DataStub1">Brent - Europe</td></tr></table></td>')
        for html in [raw,raw.replace(b'</td>',b'').replace(b'</th>',b'')]:
            parsed=m.brent_eia_page(html,FIXTURE['series']['BRENT'],dt.date(2026,10,19))
            self.assertEqual(len(parsed['observations']),6)
            self.assertEqual(parsed['observations'][0]['period'],'2026-10-07')
            self.assertEqual(parsed['observations'][-1]['value'],126.55)
            self.assertTrue(all(r['value']!=1 for r in parsed['observations']))

    def run_cli(self,failures):
        with tempfile.TemporaryDirectory() as temp,ExitStack() as stack:
            file=Path(temp)/'data.json';status=Path(temp)/'report.json';summary=Path(temp)/'summary.md'
            file.write_text(json.dumps(FIXTURE,ensure_ascii=False,indent=2)+'\n');before=file.read_bytes()
            for name in ['refresh_cub','refresh_ipca','refresh_diesel','refresh_brent']:
                if name in failures:stack.enter_context(patch.object(m,name,side_effect=ConnectionError('controlled unavailable source')))
                else:stack.enter_context(patch.object(m,name,side_effect=lambda previous,today:previous))
            stack.enter_context(patch('sys.argv',['refresh','--file',str(file),'--report',str(status)]))
            stack.enter_context(patch.dict(os.environ,{'GITHUB_ACTIONS':'true','GITHUB_STEP_SUMMARY':str(summary)}))
            output=io.StringIO();code=0
            with redirect_stdout(output):
                try:m.main()
                except SystemExit as error:code=error.code
            self.assertEqual(before,file.read_bytes(),'No new quote must not alter the data or verification age')
            return code,json.loads(status.read_text()),summary.read_text(),output.getvalue()

    def test_one_verified_unchanged_two_failed_is_partial_with_warnings(self):
        code,report,summary,output=self.run_cli({'refresh_diesel','refresh_brent'})
        self.assertEqual(code,0);self.assertEqual(report['outcome'],'partial')
        self.assertEqual(report['verified'],['CUB_GO','IPCA'])
        self.assertEqual(report['changed'],[])
        self.assertEqual(report['retainedAfterError'],['DIESEL_S10','BRENT'])
        self.assertIn('::warning title=DIESEL_S10',output)
        self.assertNotIn('INCC',output)
        self.assertIn('retained-after-error',summary)

    def test_all_sources_unavailable_still_fails_without_data_loss(self):
        code,report,summary,output=self.run_cli({'refresh_cub','refresh_ipca','refresh_diesel','refresh_brent'})
        self.assertEqual(code,1);self.assertEqual(report['outcome'],'unavailable')
        self.assertEqual(report['changed'],[]);self.assertEqual(report['verified'],[])

    def test_verified_unchanged_is_success_without_false_new_quotes(self):
        code,report,summary,output=self.run_cli(set())
        self.assertEqual(code,0);self.assertEqual(report['outcome'],'verified')
        self.assertEqual(report['changed'],[]);self.assertNotIn('::warning',output)

if __name__=='__main__':unittest.main()
