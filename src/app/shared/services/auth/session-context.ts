import { InjectionToken } from "@angular/core";

export interface SessionContext {
  logout(): void;
  fullLogout(): void;
}

export const SESSION_CONTEXT = new InjectionToken<SessionContext>('SessionContext');
