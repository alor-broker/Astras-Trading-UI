import {InstrumentKey} from "../instruments/instrument-key.model";
import {PortfolioKey} from "../portfolio-key.model";
import {Side} from "../enums/side.model";
import {LessMore} from "../enums/less-more.model";

export enum OrderType {
  Limit = 'limit',
  Market = 'market',
  Stop = 'stop'
}

export interface OrderDialogParams {
  instrumentKey: InstrumentKey;
  initialValues: {
    orderType?: OrderType;
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
      condition: LessMore | null;
      limit: boolean | null;
      disableCalculations: boolean | null;
    }>;
  };
}

export interface EditOrderDialogParams {
  orderId: string;
  orderType: OrderType;
  instrumentKey: InstrumentKey;
  portfolioKey: PortfolioKey;
  initialValues: {
    triggerPrice?: number;
    price?: number;
    quantity?: number;
    hasPriceChanged?: boolean;
  };
  cancelCallback?: () => void;
}

