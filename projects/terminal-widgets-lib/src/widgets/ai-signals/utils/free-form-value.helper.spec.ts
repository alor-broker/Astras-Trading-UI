import {FreeFormValueHelper} from './free-form-value.helper';

describe('FreeFormValueHelper', () => {
  describe('toDisplayTree', () => {
    it('should render primitive values as leaves', () => {
      const tree = FreeFormValueHelper.toDisplayTree(
        {
          name: 'value',
          count: 5,
          enabled: true
        },
        3
      );

      expect(tree).toEqual([
        {key: 'name', value: 'value', isCode: false, children: []},
        {key: 'count', value: '5', isCode: false, children: []},
        {key: 'enabled', value: 'true', isCode: false, children: []}
      ]);
    });

    it('should skip null, blank strings and non-finite numbers instead of enumerating them', () => {
      const tree = FreeFormValueHelper.toDisplayTree(
        {
          missing: null,
          blank: '   ',
          notFinite: Number.NaN,
          valid: 1
        },
        3
      );

      expect(tree.map(node => node.key)).toEqual(['valid']);
    });

    it('should join arrays of primitives and nest objects', () => {
      const tree = FreeFormValueHelper.toDisplayTree(
        {
          list: [1, 2, 3],
          nested: {inner: 'x'}
        },
        3
      );

      expect(tree[0]).toEqual({key: 'list', value: '1, 2, 3', isCode: false, children: []});
      expect(tree[1].key).toBe('nested');
      expect(tree[1].children).toEqual([{key: 'inner', value: 'x', isCode: false, children: []}]);
    });

    it('should render structures beyond the depth cap as a JSON code leaf', () => {
      const tree = FreeFormValueHelper.toDisplayTree(
        {
          l1: {l2: {l3: {l4: {deep: 1}}}}
        },
        3
      );

      const l4 = tree[0].children[0].children[0].children[0];

      expect(l4.key).toBe('l4');
      expect(l4.isCode).toBe(true);
      expect(l4.value).toBe(JSON.stringify({deep: 1}));
    });
  });
});
