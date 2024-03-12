import { HttpContextToken } from "@angular/common/http";

export class HttpContextTokens {
  static SkipAuthorization = new HttpContextToken<boolean>(() => false);
}
