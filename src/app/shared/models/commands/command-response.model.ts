export interface CommandResponse {
  message: string,
  // # of succesfully places order
  orderNumber?: string,
  // Error code if something went wrong
  code?: string
}
