export interface BaseRequest {
  opcode: string,
  // If empty, will be initialised with default value when subscribing
  token?: string,
  guid: string,
  format: string,
  exchange: string
}
