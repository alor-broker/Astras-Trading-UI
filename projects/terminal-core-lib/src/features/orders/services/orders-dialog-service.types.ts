import {InstrumentKey} from '../../../common/types/instrument.types';
import {PortfolioKey} from '../../../common/types/portfolio.types';
import {Side} from '../../../common/types/side.types';
import {Condition} from '../../../common/types/condition.types';

export interface OrdersDialogOptions {
  isNewOrderDialogSupported: boolean;
}

export enum OrderFormType {
  Limit = 'limit',
  Market = 'market',
  Stop = 'stop'
}

export interface OrderDialogParams {
  instrumentKey: InstrumentKey;
  initialValues: {
    orderType?: OrderFormType;
    price?: number;
    quantity?: number;
    bracket?: {
      topOrderPrice?: number | null;
      topOrderSide?: Side | null;
      bottomOrderPrice?: number | null;
      bottomOrderSide?: Side | null;
    };
    stopOrder?: Partial<{
      triggerPrice: number | null;
      condition: Condition | null;
      limit: boolean | null;
      disableCalculations: boolean | null;
    }>;
  };
}

export interface EditOrderDialogParams {
  orderId: string;
  instrumentKey: InstrumentKey;
  portfolioKey: PortfolioKey;

  orderType: OrderFormType;
  initialValues: {
    triggerPrice?: number;
    price?: number;
    quantity?: number;
    hasPriceChanged?: boolean;
  };
  cancelCallback?: () => void;
}
