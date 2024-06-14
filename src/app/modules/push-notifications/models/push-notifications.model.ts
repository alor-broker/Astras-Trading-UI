import {LessMore} from "../../../shared/models/enums/less-more.model";

export enum PushSubscriptionType {
  OrderExecute = 'OrderExecute',
  PriceSpark = 'PriceSpark'
}

export interface PriceChangeRequest {
  exchange: string;
  priceCondition: LessMore;
  price: number;
  instrument: string;
  board: string;
}

export interface SubscriptionBase {
  id: string;
  subscriptionType: PushSubscriptionType;
  createdAt: Date;
}

export interface PriceSparkSubscription extends SubscriptionBase {
  instrument: string;
  exchange: string;
  board?: string;
  price: number;
  priceCondition: LessMore;
}

export interface OrderExecuteSubscription extends SubscriptionBase {
  exchange: string;
  portfolio: string;
}
