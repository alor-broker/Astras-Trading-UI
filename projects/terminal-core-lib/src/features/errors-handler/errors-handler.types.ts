import {HttpErrorResponse} from '@angular/common/http';
import {InjectionToken} from '@angular/core';

export interface ApplicationErrorHandler {
  handleError(error: Error | HttpErrorResponse): void;
}

export const ERROR_HANDLER = new InjectionToken<ApplicationErrorHandler[]>('ApplicationErrorHandler');
