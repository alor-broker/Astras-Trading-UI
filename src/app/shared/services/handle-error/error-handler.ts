import { InjectionToken } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";

export interface ApplicationErrorHandler {
  handleError(error: Error | HttpErrorResponse): { handled: boolean } | null;
}

export const ERROR_HANDLER = new InjectionToken<ApplicationErrorHandler[]>('ApplicationErrorHandler');
