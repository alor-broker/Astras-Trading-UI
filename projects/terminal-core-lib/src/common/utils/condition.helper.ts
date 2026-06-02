import {Condition} from '../types/condition.types';

export class ConditionHelper {
  static getConditionTypeByString = (condition: string): Condition | null => {
    switch (condition) {
      case 'more':
        return Condition.More;
      case 'less':
        return Condition.Less;
      case 'moreorequal':
        return Condition.MoreOrEqual;
      case 'lessorequal':
        return Condition.LessOrEqual;
      default:
        return null;
    }
  };

  static getConditionSign = (conditionType: Condition): string | null => {
    switch (conditionType) {
      case Condition.More:
        return '>';
      case Condition.Less:
        return '<';
      case Condition.MoreOrEqual:
        return '≥';
      case Condition.LessOrEqual:
        return '≤';
      default:
        return null;
    }
  };
}
