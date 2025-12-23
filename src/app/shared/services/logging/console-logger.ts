import { LoggerBase } from './logger-base';
import {
  EnvironmentService,
  LogLevel
} from "../environment.service";
import { Injectable, inject } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class ConsoleLogger extends LoggerBase {
  private readonly environmentService = inject(EnvironmentService);

  private readonly minLevel: LogLevel | null = this.environmentService.logging.console?.minLevel ?? null;

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
