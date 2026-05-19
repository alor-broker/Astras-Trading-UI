import {Condition} from '../../../common/types/condition.types';

export type MessagingStatus = NotificationPermission | 'not-supported';

export interface PushMessage {
  messageId: string;
  title: string;
  body: string;
}

export enum PushSubscriptionType {
  OrderExecute = 'OrderExecute',
  PriceSpark = 'PriceSpark'
}

export interface PriceChangeRequest {
  exchange: string;
  priceCondition: Condition;
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
  price?: number;
  priceCondition: Condition;
}

export interface OrderExecuteSubscription extends SubscriptionBase {
  exchange: string;
  portfolio: string;
}
