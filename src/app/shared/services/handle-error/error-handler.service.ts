import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ERROR_HANDLER } from "./error-handler";
import { GraphQLError } from "graphql";

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService extends ErrorHandler {
  private readonly handlers = inject(ERROR_HANDLER);

  handleError(error: Error | HttpErrorResponse | GraphQLError): void {
    for (const handler of (this.handlers ?? [])) {
      handler.handleError(error);
    }
  }
}
