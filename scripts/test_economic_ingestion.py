"""Parser contracts use controlled fragments/rows, not invented production quotes."""
import copy
import datetime as dt
import io
import json
import unittest
from pathlib import Path
from unittest.mock import patch
from openpyxl import Workbook
import update_economic_data as m


class IngestionTests(unittest.TestCase):
    def test_cub_reference_not_other_typology(self):
        text = 'SETEMBRO - 2026 PADRÃO BAIXO PADRÃO NORMAL PADRÃO ALTO R-1 2.302,55 R-1 2.795,37 R-1 3.430,67 R-8 2.243,09 Valor referencial (R$/m²) R-16A Variação mês % 2.858,23 0,013 5,292 7,015'
        row = m.cub_text(text, '2026-09', 'https://www.sinduscongoias.com.br/cub.pdf')
        self.assertEqual(row['value'], 2795.37)
        self.assertNotIn('monthlyChange', row)
        with self.assertRaises(ValueError):
            m.cub_text(text.replace('R-1 2.795,37', 'R-8 2.795,37'), '2026-09', 'source')
        with self.assertRaises(ValueError):
            m.cub_text(text, '2026-10', 'source')

    def workbook(self, unit='R$/l'):
        book=Workbook();sheet=book.active;sheet.title='ESTADOS'
        for _ in range(9):sheet.append(['Publication heading'])
        sheet.append(['DATA INICIAL','DATA FINAL','ESTADOS','PRODUTO','NÚMERO DE POSTOS PESQUISADOS','UNIDADE DE MEDIDA','PREÇO MÉDIO REVENDA','PREÇO MÉDIO DISTRIBUIÇÃO'])
        sheet.append([dt.datetime(2026,10,4),dt.datetime(2026,10,10),'GOIAS','OLEO DIESEL S10',140,unit,7.36,5.99])
        out=io.BytesIO();book.save(out);return out.getvalue()

    def test_anp_plural_header_retail_weighted_value_not_distribution(self):
        rows=list(m.sheet_records(self.workbook(),'source'))
        self.assertEqual(rows[0][0],'GOIAS');self.assertEqual(rows[0][2]['value'],7.36)
        self.assertEqual(rows[0][2]['periodStart'],'2026-10-04')
        self.assertEqual(rows[0][2]['period'],'2026-10-10')
        with self.assertRaises(ValueError):list(m.sheet_records(self.workbook('R$/m³'),'source'))
        with self.assertRaises(ValueError):list(m.sheet_records(b'<html>403</html>','source'))

    def test_http_html_not_accepted_as_brent(self):
        data=json.loads((m.ROOT/'data/economic-series.json').read_text())['series']['BRENT']
        with patch.object(m,'download',return_value=b'<html>upstream blocked</html>'):
            with self.assertRaises(ValueError):m.refresh_brent(data,dt.date(2026,10,18))
        raw=b'observation_date,DCOILBRENTEU\n2026-10-13,125.78\n2026-10-14,126.55\n2026-10-15,.\n'
        with patch.object(m,'download',return_value=raw) as request:
            parsed=m.refresh_brent(data,dt.date(2026,10,18))
        self.assertEqual(request.call_args.args[0],m.BRENT+'&cosd=2026-04-21')
        self.assertEqual(len(parsed['observations']),2)
        self.assertEqual(parsed['observations'][-1]['value'],126.55)

    def test_ipca_sgs_monthly_and_published_annual_change_are_joined(self):
        monthly=[
            {'data': '01/09/2025', 'valor': '0,48'}, {'data': '01/10/2025', 'valor': '0,09'},
            {'data': '01/11/2025', 'valor': '0,18'}, {'data': '01/12/2025', 'valor': '0,33'},
            {'data': '01/01/2026', 'valor': '0,33'}, {'data': '01/02/2026', 'valor': '0,70'},
            {'data': '01/03/2026', 'valor': '0,88'}, {'data': '01/04/2026', 'valor': '0,67'},
            {'data': '01/05/2026', 'valor': '0,58'}, {'data': '01/06/2026', 'valor': '0,16'},
            {'data': '01/07/2026', 'valor': '0,07'}, {'data': '01/08/2026', 'valor': '-0,32'},
            {'data': '01/09/2026', 'valor': '0,82'},
        ]
        history=[
            {'data': '01/01/2025', 'valor': '0,16'}, {'data': '01/02/2025', 'valor': '1,31'},
            {'data': '01/03/2025', 'valor': '0,56'}, {'data': '01/04/2025', 'valor': '0,43'},
            {'data': '01/05/2025', 'valor': '0,26'}, {'data': '01/06/2025', 'valor': '0,24'},
            {'data': '01/07/2025', 'valor': '0,26'}, {'data': '01/08/2025', 'valor': '-0,11'},
            *monthly,
        ]
        annual=[
            {'data': '01/09/2025', 'valor': '5,17'}, {'data': '01/10/2025', 'valor': '4,68'},
            {'data': '01/11/2025', 'valor': '4,46'}, {'data': '01/12/2025', 'valor': '4,26'},
            {'data': '01/01/2026', 'valor': '4,44'}, {'data': '01/02/2026', 'valor': '3,81'},
            {'data': '01/03/2026', 'valor': '4,14'}, {'data': '01/04/2026', 'valor': '4,39'},
            {'data': '01/05/2026', 'valor': '4,72'}, {'data': '01/06/2026', 'valor': '4,64'},
            {'data': '01/07/2026', 'valor': '4,44'}, {'data': '01/08/2026', 'valor': '4,22'},
            {'data': '01/09/2026', 'valor': '4,58'},
        ]
        index=[
            {'D2C': '202509', 'V': '7359.06'}, {'D2C': '202510', 'V': '7365.68'},
            {'D2C': '202511', 'V': '7378.94'}, {'D2C': '202512', 'V': '7403.29'},
            {'D2C': '202601', 'V': '7427.72'}, {'D2C': '202602', 'V': '7479.71'},
            {'D2C': '202603', 'V': '7545.53'}, {'D2C': '202604', 'V': '7596.09'},
            {'D2C': '202605', 'V': '7640.15'}, {'D2C': '202606', 'V': '7652.37'},
            {'D2C': '202607', 'V': '7657.73'}, {'D2C': '202608', 'V': '7633.23'},
            {'D2C': '202609', 'V': '7695.82'},
        ]
        previous=copy.deepcopy(json.loads((m.ROOT/'data/economic-series.json').read_text())['series']['IPCA'])
        def response(url):
            return json.dumps(monthly if url==m.IPCA_MONTHLY else history if url==m.IPCA_HISTORY else annual if url==m.IPCA_12M else index).encode()
        with patch.object(m,'download',side_effect=response):
            result=m.refresh_ipca(previous,dt.date(2026,10,21))
        self.assertEqual(result['observations'][-1]['value'],0.82)
        self.assertEqual(result['observations'][-1]['annualChange'],4.58)
        self.assertEqual(result['observations'][-1]['yearToDate'],3.95)
        self.assertEqual(result['historySourceURL'],m.IPCA_HISTORY)
        self.assertEqual(result['indexSourceURL'],m.IPCA_INDEX)
        self.assertEqual(result['indexSeries'],'IBGE-SIDRA-1737-2266')
        self.assertEqual(result['observations'][-1]['indexValue'],7695.82)
        self.assertTrue(all(row['indexSourceURL']==m.IPCA_INDEX for row in result['observations']))
        self.assertTrue(all(row['sourceURL']==m.IPCA_MONTHLY for row in result['observations']))
        self.assertTrue(all(row['annualChangeSourceURL']==m.IPCA_12M for row in result['observations']))

    def test_sidra_index_rejects_missing_or_duplicate_months(self):
        raw=json.dumps([{'D2C':'202607','V':'7657.73'},{'D2C':'202608','V':'7633.23'}]).encode()
        self.assertEqual(m.sidra_index(raw,m.IPCA_INDEX)[-1]['period'],'2026-08')
        with self.assertRaises(ValueError):m.sidra_index(json.dumps([{'D2C':'202607','V':'7657.73'},{'D2C':'202607','V':'7657.73'}]).encode(),m.IPCA_INDEX)
        with self.assertRaises(ValueError):m.sidra_index(json.dumps([{'D2C':'202607','V':'..'}]).encode(),m.IPCA_INDEX)

    def test_ipca_rejects_duplicate_month(self):
        raw=json.dumps([{'data':'01/09/2026','valor':'0,82'},{'data':'15/09/2026','valor':'0,82'}]).encode()
        with self.assertRaises(ValueError):m.sgs_monthly(raw,m.IPCA_MONTHLY)

    def test_only_timeout_gets_one_retry(self):
        response=unittest.mock.MagicMock()
        response.__enter__.return_value=response
        response.status=200;response.read.return_value=b'valid bytes'
        with patch.object(m.urllib.request,'urlopen',side_effect=[TimeoutError('controlled timeout'),response]) as request:
            self.assertEqual(m.download(m.BRENT),b'valid bytes')
            self.assertEqual(request.call_count,2)
        blocked=m.urllib.error.HTTPError(m.BRENT,403,'Forbidden',None,None)
        with patch.object(m.urllib.request,'urlopen',side_effect=blocked) as request:
            with self.assertRaises(m.urllib.error.HTTPError):m.download(m.BRENT)
            self.assertEqual(request.call_count,1)


if __name__ == '__main__':unittest.main()
