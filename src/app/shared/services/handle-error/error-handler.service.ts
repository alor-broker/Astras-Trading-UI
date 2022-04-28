import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Inject, Injectable } from '@angular/core';
import { ApplicationErrorHandler, ERROR_HANDLER } from "./error-handler";


@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService extends ErrorHandler {
  constructor(
    @Inject(ERROR_HANDLER)
    private readonly handlers: ApplicationErrorHandler[]
  ) {
    super();
  }

  handleError(error: Error | HttpErrorResponse): void {
    for (const handler of (this.handlers ?? [])) {
      handler.handleError(error);
    }
  }
}
