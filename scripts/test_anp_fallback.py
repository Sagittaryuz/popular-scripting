import datetime as dt
import json
import unittest
from pathlib import Path
from unittest.mock import patch

import update_economic_data as collector

TODAY = dt.date(2026, 11, 25)
PREVIOUS = json.loads((Path(__file__).resolve().parents[1] / 'data' /
                       'economic-series.json').read_text())['series']['DIESEL_S10']
PERIOD = '2026-11-21'
PREVIOUS['observations'] = [r for r in PREVIOUS['observations'] if r['period'] < PERIOD]
WEEKLY = collector.ANP_ROOT + 'resumo_semanal_lpc_2026_11_15_2026-11-21.xlsx'


class ANPFallbackTest(unittest.TestCase):
    def check(self, *, municipal=False, weekly=True, state=False, coverage=True):
        def download(url):
            if url == collector.ANP_LATEST and weekly:
                return f'<a href="{WEEKLY}">XLSX</a>'.encode()
            if url == WEEKLY or url == collector.ANP_STATES and state:
                return b'PK'
            raise OSError('simulated reset')

        def sheet_records(raw, source):
            def record(value):
                return dict(period=PERIOD, periodStart='2026-11-15', value=value, sourceURL=source)
            yield 'GO', '', record(7.14)
            if source == WEEKLY and coverage:
                yield 'GO', 'GOIANIA', record(7.13)
                if municipal:
                    yield 'GO', 'JATAI', record(7.15)

        with patch.object(collector, 'download', download), patch.object(collector, 'sheet_records', sheet_records):
            return collector.refresh_diesel(PREVIOUS, TODAY)['observations']

    def test_weekly_recovers_after_both_historical_downloads_fail(self):
        rows = self.check()
        self.assertEqual(rows[-1]['period'], PERIOD)
        self.assertEqual(rows[-1]['value'], 7.14)
        self.assertTrue(rows[-1]['noMunicipalResult'])
        self.assertEqual(rows[-1]['municipalitySourceURL'], WEEKLY)
        previous = PREVIOUS['observations'][-1]
        self.assertIn(previous, rows)

    def test_prefers_verified_jatai_for_same_week(self):
        rows = self.check(municipal=True)
        self.assertEqual(rows[-1]['geography'], 'JATAI-GO')
        self.assertFalse(rows[-2]['noMunicipalResult'])

    def test_no_false_municipal_absence_when_only_state_is_available(self):
        row = self.check(weekly=False, state=True)[-1]
        self.assertNotIn('noMunicipalResult', row)
        self.assertNotIn('municipalitySourceURL', row)

    def test_weekly_missing_municipal_coverage_is_not_published(self):
        with self.assertRaises(ValueError):
            self.check(coverage=False)

    def test_all_sources_failed(self):
        with self.assertRaises(ValueError):
            self.check(weekly=False)


if __name__ == '__main__':
    unittest.main()
