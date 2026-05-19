import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {Side} from '@terminal-core-lib/common/types/side.types';

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
