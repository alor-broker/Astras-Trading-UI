import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  Type
} from '@angular/core';
import {LoggerService} from './services/logger-service';
import {LOGGER} from './loggers/logger.types';

export function provideLogging(loggers: Type<unknown>[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...loggers.map(t => ({
      provide: LOGGER,
      useClass: t,
      multi: true
    })),
    LoggerService
  ]);
}
