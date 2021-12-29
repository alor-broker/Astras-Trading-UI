import { BaseRequest } from "../ws/base-request.model";

export interface QuotesRequest extends BaseRequest  {
  code: string,
  instrumentGroup?: string
}
