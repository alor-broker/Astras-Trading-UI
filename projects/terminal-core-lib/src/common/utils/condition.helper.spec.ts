import {ConditionHelper} from './condition.helper';
import {Condition} from '../types/condition.types';

describe('ConditionHelper', () => {
  describe('getConditionTypeByString', () => {
    it('should map known condition strings to enum values', () => {
      expect(ConditionHelper.getConditionTypeByString('more')).toBe(Condition.More);
      expect(ConditionHelper.getConditionTypeByString('less')).toBe(Condition.Less);
      expect(ConditionHelper.getConditionTypeByString('moreorequal')).toBe(Condition.MoreOrEqual);
      expect(ConditionHelper.getConditionTypeByString('lessorequal')).toBe(Condition.LessOrEqual);
    });

    it('should return null for an unknown condition string', () => {
      expect(ConditionHelper.getConditionTypeByString('unknown')).toBeNull();
    });

    it('should be case sensitive and return null for differently cased input', () => {
      expect(ConditionHelper.getConditionTypeByString('More')).toBeNull();
    });
  });

  describe('getConditionSign', () => {
    it('should map enum values to their display signs', () => {
      expect(ConditionHelper.getConditionSign(Condition.More)).toBe('>');
      expect(ConditionHelper.getConditionSign(Condition.Less)).toBe('<');
      expect(ConditionHelper.getConditionSign(Condition.MoreOrEqual)).toBe('≥');
      expect(ConditionHelper.getConditionSign(Condition.LessOrEqual)).toBe('≤');
    });

    it('should return null for an unknown condition type', () => {
      expect(ConditionHelper.getConditionSign('unexpected' as Condition)).toBeNull();
    });
  });
});
