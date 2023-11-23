import {
  LoggerBase,
  LogLevel
} from './logger-base';
import { environment } from '../../../../environments/environment';

export class ConsoleLogger extends LoggerBase {
  logMessage(logLevel: LogLevel, message: string, stack?: string): void {
    const minLevel = this.getMinLevel();
    if (!minLevel) {
      return;
    }

    if (!this.isLevelApplicable(minLevel, logLevel)) {
      return;
    }

    switch (logLevel) {
      case LogLevel.trace:
        console.trace(message);
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

  getMinLevel(): LogLevel | null {
    return (environment.logging as any)?.console?.minLevel as LogLevel | undefined ?? null;
  }
}
