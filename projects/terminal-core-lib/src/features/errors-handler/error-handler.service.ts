import {
  ErrorHandler,
  inject,
  Injectable
} from '@angular/core';
import {ERROR_HANDLER} from './errors-handler.types';
import {HttpErrorResponse} from '@angular/common/http';
import {GraphQLError} from 'graphql/error';

@Injectable()
export class ErrorHandlerService extends ErrorHandler {
  private readonly handlers = inject(ERROR_HANDLER, {optional: true});

  override handleError(error: Error | HttpErrorResponse | GraphQLError): void {
    for (const handler of (this.handlers ?? [])) {
      handler.handleError(error);
    }
  }
}
