import {
  inject,
  Injectable
} from '@angular/core';
import {LoggerBase} from './logger.types';
import {LogLevel} from '../logger.types';
import {
  LOGGING_CONFIG,
  LoggingConfig
} from '../logger-config.types';

@Injectable()
export class ConsoleLogger extends LoggerBase {
  private readonly loggingConfig = inject<LoggingConfig>(LOGGING_CONFIG);

  private readonly minLevel: LogLevel | null = this.loggingConfig.console?.minLevel ?? null;

  logMessage(logLevel: LogLevel, message: string, stack?: string): void {
    if (this.minLevel == null) {
      return;
    }

    if (!this.isLevelApplicable(this.minLevel, logLevel)) {
      return;
    }

    switch (logLevel) {
      case LogLevel.trace:
        console.trace(message);
        break;
      case LogLevel.debug:
        console.debug(message);
        break;
      case LogLevel.info:
        console.info(message);
        break;
      case LogLevel.warn:
        console.warn(message);
        break;
      case LogLevel.error:
        console.error(message, stack);
        break;
      default:
        console.log(message);
    }
  }
}
