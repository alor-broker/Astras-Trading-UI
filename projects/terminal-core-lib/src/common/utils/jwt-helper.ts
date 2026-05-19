export interface JwtBody {
  exp: number;
  portfolios: string;
  clientid: string;
  ein: string;
  agreements: string;
  sub: string;
}

export class JwtHelper {
  static decodeJwtBody(jwt: string): JwtBody {
    const mainPart = jwt.split('.')[1];
    const decodedString = atob(mainPart);
    return JSON.parse(decodedString) as JwtBody;
  }
}
