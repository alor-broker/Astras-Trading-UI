import {InjectionToken} from '@angular/core';
import {InstrumentKey} from '../../../common/types/instrument.types';
import {Side} from '../../../common/types/side.types';
import {Condition} from '../../../common/types/condition.types';

export enum OrderFormType {
  Limit = 'limit',
  Market = 'market',
  Stop = 'stop'
}

export interface SubmitOrderParams {
  instrumentKey: InstrumentKey;
  /** When omitted, the user can choose either side. */
  side?: Side;
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

export interface SubmitOrderContext {
  /** Starts the platform order-entry flow; does not automatically place an order. */
  submitOrder(params: SubmitOrderParams): void;
}

export const SUBMIT_ORDER_CONTEXT = new InjectionToken<SubmitOrderContext>('SubmitOrderContext');
