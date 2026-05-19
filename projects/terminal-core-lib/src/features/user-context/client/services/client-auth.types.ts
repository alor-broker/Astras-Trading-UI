import {User} from "../../user.types";

export enum AuthStateStatus {
  Initial = 'initial',
  Refreshing = 'refreshing',
  Ready = 'ready',
  Exited = 'exited'
}

export interface IdentityState {
  refreshToken: string;
  jwt: string;
}

export interface JwtState extends IdentityState {
  expirationTime: number;
  user: User;
}

export interface AuthContext {
  status: AuthStateStatus;
  state: JwtState | null;
}
