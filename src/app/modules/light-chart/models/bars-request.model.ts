import { BaseRequest } from "src/app/shared/models/ws/base-request.model";

export interface BarsRequest extends BaseRequest {
  code: string, // "SBER",
  tf: number, // 60,
  from: number, // 1629648038,
}
