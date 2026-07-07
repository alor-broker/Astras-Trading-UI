import {FreeFormValueHelper} from './free-form-value.helper';

describe('FreeFormValueHelper', () => {
  describe('toDisplayTree', () => {
    it('should humanize keys and format primitive leaves', () => {
      const tree = FreeFormValueHelper.toDisplayTree(
        {
          asset_trend: 'BEARISH',
          NetIncome: 5,
          hanging_man: true
        },
        3
      );

      expect(tree).toEqual([
        {label: 'Asset Trend', type: 'leaf', value: 'BEARISH', isBoolean: false, booleanValue: false, trend: 'none', children: []},
        {label: 'Net Income', type: 'leaf', value: '5', isBoolean: false, booleanValue: false, trend: 'none', children: []},
        {label: 'Hanging Man', type: 'leaf', value: 'true', isBoolean: true, booleanValue: true, trend: 'none', children: []}
      ]);
    });

    it('should keep domain acronyms uppercase in labels', () => {
      const tree = FreeFormValueHelper.toDisplayTree({rsi: 41.42, macd_hist: 0.14, ev_ebitda: 3.98}, 3);

      expect(tree.map(node => node.label)).toEqual(['RSI', 'MACD Hist', 'EV EBITDA']);
    });

    it('should render yoy as a signed percentage with a trend', () => {
      const tree = FreeFormValueHelper.toDisplayTree({yoy: 0.1478}, 3);

      expect(tree[0]).toEqual({
        label: 'YoY', type: 'leaf', value: '+14.78%', isBoolean: false, booleanValue: false, trend: 'up', children: []
      });
    });

    it('should treat *_percent values as already-percentage and drop the suffix from the label', () => {
      const tree = FreeFormValueHelper.toDisplayTree({distance_from_sma_20_percent: -4.4387}, 3);

      expect(tree[0].label).toBe('Distance From SMA 20');
      expect(tree[0].value).toBe('-4.44%');
      expect(tree[0].trend).toBe('down');
    });

    it('should group thousands for large integer magnitudes', () => {
      const tree = FreeFormValueHelper.toDisplayTree({volume: 2735540}, 3);

      expect(tree[0].value).toBe('2 735 540');
    });

    it('should skip null, blank strings and non-finite numbers', () => {
      const tree = FreeFormValueHelper.toDisplayTree(
        {
          missing: null,
          blank: '   ',
          notFinite: Number.NaN,
          valid: 1
        },
        3
      );

      expect(tree.map(node => node.label)).toEqual(['Valid']);
    });

    it('should join arrays of primitives and nest objects as groups', () => {
      const tree = FreeFormValueHelper.toDisplayTree(
        {
          list: [1, 2, 3],
          basic_data: {price: 97.84}
        },
        3
      );

      expect(tree[0]).toEqual({
        label: 'List', type: 'leaf', value: '1, 2, 3', isBoolean: false, booleanValue: false, trend: 'none', children: []
      });
      expect(tree[1].type).toBe('group');
      expect(tree[1].label).toBe('Basic Data');
      expect(tree[1].children[0]).toEqual({
        label: 'Price', type: 'leaf', value: '97.84', isBoolean: false, booleanValue: false, trend: 'none', children: []
      });
    });

    it('should render structures beyond the depth cap as a JSON leaf', () => {
      const tree = FreeFormValueHelper.toDisplayTree(
        {
          l1: {l2: {l3: {l4: {deep: 1}}}}
        },
        3
      );

      const l4 = tree[0].children[0].children[0].children[0];

      expect(l4.label).toBe('L4');
      expect(l4.type).toBe('leaf');
      expect(l4.value).toBe(JSON.stringify({deep: 1}));
    });
  });
});
