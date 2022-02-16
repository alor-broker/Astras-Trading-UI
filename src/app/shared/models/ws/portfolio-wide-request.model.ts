import { BaseRequest } from "src/app/shared/models/ws/base-request.model";

export interface PortfolioWideRequest extends BaseRequest {
  portfolio: string
}
