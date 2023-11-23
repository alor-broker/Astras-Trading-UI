import { AllTradesItem } from '../../../shared/models/all-trades.model';

export const sortByTimestamp = (a: AllTradesItem, b: AllTradesItem): number => b.timestamp - a.timestamp;

export const ITEM_HEIGHT = 29;
