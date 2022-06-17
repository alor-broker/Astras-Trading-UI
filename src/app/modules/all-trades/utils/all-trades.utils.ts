import { AllTradesItem } from "../models/all-trades.model";

export const sortByTimestamp = (a: AllTradesItem, b: AllTradesItem) => b.timestamp - a.timestamp;

export const ITEM_HEIGHT = 29;
