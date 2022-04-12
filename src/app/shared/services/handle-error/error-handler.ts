import { InjectionToken } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";

export interface ErrorHandlingResult {
  handled: boolean;
}

export interface ApplicationErrorHandler {
  handleError(error: Error | HttpErrorResponse): ErrorHandlingResult;
}

export const ERROR_HANDLER = new InjectionToken<ApplicationErrorHandler[]>('ApplicationErrorHandler');
