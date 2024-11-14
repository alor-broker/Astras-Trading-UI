import { JwtBody } from "../models/user/jwt.model";

export class JwtHelper {
  static decodeJwtBody(jwt: string): JwtBody {
    const mainPart = jwt.split('.')[1];
    const decodedString = atob(mainPart);
    return JSON.parse(decodedString) as JwtBody;
  }
}
