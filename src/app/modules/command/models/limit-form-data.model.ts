export interface LimitFormData {
  instrumentGroup?: string;
  quantity: number;
  price: number;
  isIceberg?: boolean;
  timeInForce?: string;
  icebergFixed?: number;
  icebergVariance?: number;
}
