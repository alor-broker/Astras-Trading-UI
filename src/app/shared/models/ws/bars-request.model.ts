import { BaseRequest } from "./base-request.model";

export interface BarsRequest extends BaseRequest {
  code: string,
  tf: number,
  from: number,
  delayed: boolean
}
