import {
  Inject,
  Injectable
} from "@angular/core";
import {
  LOGGER,
  LoggerBase,
  LogLevel
} from './logger-base';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  constructor(
    @Inject(LOGGER)
    private readonly loggers: LoggerBase[]
  ) {
  }

  public info(message: string): void {
    this.logMessage(LogLevel.info, message);
  }

  public trace(message: string): void {
    this.logMessage(LogLevel.trace, message);
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
    this.loggers.forEach(l => l.logMessage(logLevel, message, stack));
  }
}
