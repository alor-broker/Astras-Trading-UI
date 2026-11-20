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

export enum ClientType {
  Individual = 'P',
  LegalEntity = 'J',
  NotSpecified = 'NotSpecified'
}

export interface User {
  login?: string;
  portfolios: string[];
  clientId?: string;
  clientType?: ClientType;
  roles?: Role[];
  permissions?: Permission[];
}
