import { User } from "../../models/user/user.model";
import { Observable } from "rxjs";
import { InjectionToken } from "@angular/core";

export interface UserContext {
  getUser(): Observable<User>;
}

export const USER_CONTEXT = new InjectionToken<UserContext>('UserContext');
