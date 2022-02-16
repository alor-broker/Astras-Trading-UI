import { BaseRequest } from "src/app/shared/models/ws/base-request.model";

export interface BarsRequest extends BaseRequest {
  code: string, // "SBER",
  tf: string, // 60, D
  from: number, // 1629648038,
  instrumentGroup?: string // TQBR or SMAL
}
