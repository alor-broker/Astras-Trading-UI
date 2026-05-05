import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import {Side} from "../../../shared/models/enums/side.model";

export interface OrdersBasketItem {
  instrumentKey: InstrumentKey;

  quota: number;

  quantity: number;

  price: number;

  id: string;
}

export enum CalculationMode {
  Cash = 'cash',
  Margin = 'margin'
}

export interface OrdersBasket {
  budget: number;
  side?: Side;
  mode?: CalculationMode;
  items: OrdersBasketItem[];
}
