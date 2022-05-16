import { BaseUser } from "./base-user.model";

export interface User extends BaseUser{
  portfolios: Array<string>,
  clientId: string
}
