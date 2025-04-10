export enum Role {
  Client = 'client',
  Admin = 'admin'
}

export interface User {
  login?: string;
  portfolios: string[];
  clientId?: string;
  roles?: Role[];
}
