import { LessMore } from '../models/enums/less-more.model';
import { getConditionTypeByString, getConditionSign } from './order-conditions-helper';

describe('OrderConditionsHelper', () => {
  describe('getConditionTypeByString', () => {
    it('should return LessMore.More for "more"', () => {
      expect(getConditionTypeByString('more')).toBe(LessMore.More);
    });

    it('should return LessMore.Less for "less"', () => {
      expect(getConditionTypeByString('less')).toBe(LessMore.Less);
    });

    it('should return LessMore.MoreOrEqual for "moreorequal"', () => {
      expect(getConditionTypeByString('moreorequal')).toBe(LessMore.MoreOrEqual);
    });

    it('should return LessMore.LessOrEqual for "lessorequal"', () => {
      expect(getConditionTypeByString('lessorequal')).toBe(LessMore.LessOrEqual);
    });

    it('should return null for an unknown condition string', () => {
      expect(getConditionTypeByString('unknown')).toBeNull();
    });

    it('should return null for an empty condition string', () => {
      expect(getConditionTypeByString('')).toBeNull();
    });
  });

  describe('getConditionSign', () => {
    it('should return ">" for LessMore.More', () => {
      expect(getConditionSign(LessMore.More)).toBe('>');
    });

    it('should return "<" for LessMore.Less', () => {
      expect(getConditionSign(LessMore.Less)).toBe('<');
    });

    it('should return "≥" for LessMore.MoreOrEqual', () => {
      expect(getConditionSign(LessMore.MoreOrEqual)).toBe('≥');
    });

    it('should return "≤" for LessMore.LessOrEqual', () => {
      expect(getConditionSign(LessMore.LessOrEqual)).toBe('≤');
    });

    it('should return null for an unknown LessMore value', () => {
      expect(getConditionSign('unknown' as LessMore)).toBeNull();
    });
  });
});
