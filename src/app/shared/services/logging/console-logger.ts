import { LoggerBase } from './logger-base';
import {
  EnvironmentService,
  LogLevel
} from "../environment.service";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class ConsoleLogger extends LoggerBase {
  private readonly minLevel: LogLevel | null = this.environmentService.logging.console?.minLevel ?? null;

  constructor(private readonly environmentService: EnvironmentService) {
    super();
  }

  logMessage(logLevel: LogLevel, message: string, stack?: string): void {
    if (!this.minLevel) {
      return;
    }

    if (!this.isLevelApplicable(this.minLevel, logLevel)) {
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
}
