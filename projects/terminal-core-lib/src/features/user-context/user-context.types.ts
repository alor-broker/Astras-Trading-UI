import {Observable} from 'rxjs';
import {User} from "./user.types";
import {InjectionToken} from '@angular/core';

export interface UserContext {
  getUser(): Observable<User>;
}

export const USER_CONTEXT = new InjectionToken<UserContext>('UserContext');

export interface SessionContext {
  logout(): void;

  fullLogout(): void;
}

export const SESSION_CONTEXT = new InjectionToken<SessionContext>('SessionContext');
