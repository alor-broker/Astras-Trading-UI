export interface JwtBody {
  exp: number,
  portfolios: string,
  clientId: string,
  ein: string,
  agreements: string,
  sub: string,
}
