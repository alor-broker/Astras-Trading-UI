import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Inject, Injectable } from '@angular/core';
import { ApplicationErrorHandler, ERROR_HANDLER } from "./error-handler";
import { GraphQLError } from "graphql";

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService extends ErrorHandler {
  constructor(
    @Inject(ERROR_HANDLER)
    private readonly handlers: ApplicationErrorHandler[] | undefined
  ) {
    super();
  }

  handleError(error: Error | HttpErrorResponse | GraphQLError): void {
    for (const handler of (this.handlers ?? [])) {
      handler.handleError(error);
    }
  }
}
