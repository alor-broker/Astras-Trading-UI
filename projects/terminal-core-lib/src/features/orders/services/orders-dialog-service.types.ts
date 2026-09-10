import {InstrumentKey} from '../../../common/types/instrument.types';
import {PortfolioKey} from '../../../common/types/portfolio.types';
import {OrderFormType, SubmitOrderParams} from '../types/submit-order-context.types';

export {OrderFormType};

export interface OrdersDialogOptions {
  isNewOrderDialogSupported: boolean;
}

export type OrderDialogParams = SubmitOrderParams;

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
