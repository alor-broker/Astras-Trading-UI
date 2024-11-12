import { InstrumentKey } from "../instruments/instrument-key.model";
import { PortfolioKey } from "../portfolio-key.model";
import { Side } from "../enums/side.model";
import { LessMore } from "../enums/less-more.model";

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
      condition: LessMore | null;
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
