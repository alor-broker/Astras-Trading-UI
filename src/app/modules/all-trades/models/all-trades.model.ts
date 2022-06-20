import { BaseRequest } from "../../../shared/models/ws/base-request.model";

export interface GetAllTradesRequest {
  exchange: string;
  symbol: string;
  from: number;
  to: number;
  take: number;
}

export interface AllTradesSubRequest extends BaseRequest {
  code: string;
}

export interface AllTradesItem {
  existing: boolean;
  id: number;
  oi: number;
  orderno: number;
  price: number;
  qty: number;
  side: string;
  symbol: string;
  time: string;
  timestamp: number;
}
