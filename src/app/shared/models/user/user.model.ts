export enum Role {
  Client = 'client',
  Admin = 'admin'
}

export enum Permission {
  CancelOrder = 'cancelOrder',
  EditOrder = 'editOrder',
  ClosePosition = 'closePosition',
  ReversePosition = 'reversePosition'
}

export interface User {
  login?: string;
  portfolios: string[];
  clientId?: string;
  roles?: Role[];
  permissions?: Permission[];
}
