import { LessMore } from "../models/enums/less-more.model";

export const getConditionTypeByString = (condition: string): LessMore | null => {
  switch (condition) {
    case 'more':
      return LessMore.More;
    case 'less':
      return LessMore.Less;
    case 'moreorequal':
      return LessMore.MoreOrEqual;
    case 'lessorequal':
      return LessMore.LessOrEqual;
    default:
      return null;
  }
};

export const getConditionSign = (conditionType: LessMore): string | null => {
  switch (conditionType) {
    case LessMore.More:
      return '>';
    case LessMore.Less:
      return '<';
    case LessMore.MoreOrEqual:
      return '≥';
    case LessMore.LessOrEqual:
      return '≤';
    default:
      return null;
  }
};
