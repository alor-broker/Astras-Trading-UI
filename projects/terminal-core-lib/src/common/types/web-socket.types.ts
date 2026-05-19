export interface BaseResponse<T> {
  data: T;
  guid: string;
}

export interface ConfirmResponse {
  requestGuid: string;
  httpCode: number;
  message: string;
}
