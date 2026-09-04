import {FundamentalGroup} from '../types/fundamental-view.types';
import {FundamentalViewModelHelper} from './fundamental-view-model.helper';

describe('FundamentalViewModelHelper', () => {
  it('should hide unavailable, empty and metadata-only reports', () => {
    for (const data of [null, {}, {available: false, latest: {Revenue: {value_mln: 10}}}, {currency: 'RUB'}]) {
      expect(FundamentalViewModelHelper.toViewModel(data)).toBeNull();
    }
  });

  it('should preserve zero and negative values and convert year-on-year ratios to percentages', () => {
    const view = FundamentalViewModelHelper.toViewModel({latest: {
      Revenue: {value_mln: 0, yoy: 0},
      NetIncome: {value_mln: '-12.5', yoy: -0.25}
    }});

    expect(view?.groups).toEqual([{key: FundamentalGroup.Income, rows: [
      {key: 'Revenue', labelKey: 'metrics.Revenue', value: 0, yoyPercent: 0},
      {key: 'NetIncome', labelKey: 'metrics.NetIncome', value: -12.5, yoyPercent: -25}
    ]}]);
  });

  it('should not turn invalid or missing numbers into zero', () => {
    for (const value of [null, undefined, '', ' ', true, [], {}, 'invalid', NaN, Infinity]) {
      const view = FundamentalViewModelHelper.toViewModel({latest: {Revenue: {value_mln: value, yoy: value}}});

      expect(view?.groups[0].rows[0]).toMatchObject({value: null, yoyPercent: null});
    }
    const overflow = FundamentalViewModelHelper.toViewModel({latest: {Revenue: {yoy: Number.MAX_VALUE}}});
    expect(overflow?.groups[0].rows[0].yoyPercent).toBeNull();
  });

  it('should retain unknown metrics in the other group', () => {
    const view = FundamentalViewModelHelper.toViewModel({latest: {NewMetric: {value_mln: 10}}});

    expect(view?.groups).toEqual([{key: FundamentalGroup.Other, rows: [
      {key: 'NewMetric', labelKey: null, value: 10, yoyPercent: null}
    ]}]);
  });

  it('should sort quarters, deduplicate periods and preserve gaps without modifying the response', () => {
    const data = {trend: {Revenue: [
      {period: '2026 Q1', value_mln: 3},
      {period: '2025 Q4', value_mln: null},
      {period: ' 2025 q3 ', value_mln: 1},
      {period: '2026 Q1', value_mln: 4},
      {period: '', value_mln: 100}
    ]}};
    const original = structuredClone(data);

    expect(FundamentalViewModelHelper.toViewModel(data)?.trends[0].points).toEqual([
      {period: '2025 Q3', value: 1}, {period: '2025 Q4', value: null}, {period: '2026 Q1', value: 4}
    ]);
    expect(data).toEqual(original);
  });

  it('should hide histories without any valid numbers', () => {
    expect(FundamentalViewModelHelper.toViewModel({trend: {
      Revenue: [{period: '2026 Q1', value_mln: null}],
      NetIncome: 'invalid'
    }})).toBeNull();
  });

  it('should suppress only exact banking net-income aliases', () => {
    const series = [{period: '2026 Q1', value_mln: 0}];
    const view = FundamentalViewModelHelper.toViewModel({trend: {NetIncome: series, FinIncomeNet: series, Revenue: series}});

    expect(view?.trends.map(trend => trend.key)).toEqual(['NetIncome', 'Revenue']);
    const different = FundamentalViewModelHelper.toViewModel({trend: {
      NetIncome: series, FinIncomeNet: [{period: '2026 Q1', value_mln: 1}]
    }});
    expect(different?.trends).toHaveLength(2);
  });

  it('should normalize notes and absent metrics without listing disclosed metrics as absent', () => {
    const view = FundamentalViewModelHelper.toViewModel({
      latest: {Revenue: {value_mln: 10}},
      notes: [' Note ', 'Note', '', null],
      absent: ['Revenue', ' EBITDA ', 'EBITDA', 'Unknown', 1]
    });

    expect(view?.notes).toEqual(['Note']);
    expect(view?.absent).toEqual([{key: 'EBITDA', labelKey: 'metrics.EBITDA'}, {key: 'Unknown', labelKey: null}]);
  });

  it('should validate calendar dates and retain zero-valued valuation and dividends', () => {
    const view = FundamentalViewModelHelper.toViewModel({
      as_of: {statement: 'MSFO', report_period: '2026 q1', disclosed: '2026-02-30'},
      decision_date: '2026-09-04',
      valuation: {ev_ebitda: 0, as_of_date: 'not a date'},
      dividend: {reported_mln: 0, period: '2026 q1'}
    });

    expect(view).toMatchObject({
      reportPeriod: '2026 Q1', statementLabelKey: 'statements.MSFO', disclosed: null,
      decisionDate: '2026-09-04', valuation: {evEbitda: 0, asOf: null}, dividend: {value: 0, period: '2026 Q1'}
    });
  });
});
