export interface TokenState {
  token: string;
  expirationTime: number;
  refreshCallback: () => void;
}
