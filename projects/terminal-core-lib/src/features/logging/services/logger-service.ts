import {
  inject,
  Injectable
} from '@angular/core';
import {LOGGER} from '../loggers/logger.types';
import {LogLevel} from '../logger.types';

@Injectable()
export class LoggerService {
  private readonly loggers = inject(LOGGER, {optional: true});

  public info(message: string): void {
    this.logMessage(LogLevel.info, message);
  }

  public trace(message: string): void {
    this.logMessage(LogLevel.trace, message);
  }

  public debug(...messages: string[]): void {
    for (const message of messages) {
      this.logMessage(LogLevel.debug, message);
    }
  }

  public warn(...details: string[]): void {
    this.logMessage(LogLevel.warn, details.join('_'));
  }

  public error(message: string, error?: Error): void {
    this.logMessage(
      LogLevel.error,
      message,
      [
        error?.message,
        error?.stack
      ].join('\n')
    );
  }

  private logMessage(logLevel: LogLevel, message: string, stack?: string): void {
    (this.loggers ?? []).forEach(l => l.logMessage(logLevel, message, stack));
  }
}
