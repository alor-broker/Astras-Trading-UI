export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResult {
  jwt: string;
  refreshToken: string;
  refreshExpirationAt: number;
}

export enum LoginStatus {
  Success = 'success',
  WrongCredentials = 'wrongCredentials'
}

export interface LoginResponse {
  result: LoginResult | null;
  status: LoginStatus;
}
