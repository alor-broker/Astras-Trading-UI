import {
  EnvironmentProviders,
  ErrorHandler,
  makeEnvironmentProviders,
  Type
} from '@angular/core';
import {ErrorHandlerService} from './error-handler.service';
import {ERROR_HANDLER} from '@terminal-core-lib/features/errors-handler/errors-handler.types';


export function provideErrorHandlers(handlers: Type<any>[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    ErrorHandlerService,
    {
      provide: ErrorHandler,
      useExisting: ErrorHandlerService
    },
    ...handlers.map(h => ({
      provide: ERROR_HANDLER,
      useClass: h,
      multi: true
    }))
  ]);
}
