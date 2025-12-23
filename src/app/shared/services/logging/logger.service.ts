import { Injectable, inject } from "@angular/core";
import {
  LOGGER
} from './logger-base';
import { LogLevel } from "../environment.service";

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly loggers = inject(LOGGER);

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
