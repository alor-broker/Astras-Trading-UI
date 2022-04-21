import { BaseRequest } from 'src/app/shared/models/ws/base-request.model';

export interface OrderbookRequest extends BaseRequest {
  code: string,
  depth: number,
  instrumentGroup?: string
}
