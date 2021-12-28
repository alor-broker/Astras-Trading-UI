import { BaseRequest } from "src/app/shared/models/ws/base-request.model";

export interface OrdersRequest extends BaseRequest {
  portfolio: string
}
