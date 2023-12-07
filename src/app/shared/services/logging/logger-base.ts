import { InjectionToken } from '@angular/core';
import { LogLevel } from "../environment.service";

export abstract class LoggerBase {
  private readonly levelPriorities = [
    LogLevel.trace,
    LogLevel.info,
    LogLevel.warn,
    LogLevel.error
  ];

  abstract logMessage(
    logLevel: LogLevel,
    message: string,
    stack?: string
  ): void;

  protected isLevelApplicable(minLevel: LogLevel, currentLevel: LogLevel): boolean {
    const minLevelIndex = this.levelPriorities.indexOf(minLevel);
    const logLevelIndex = this.levelPriorities.indexOf(currentLevel);

    return logLevelIndex >= minLevelIndex;
  }
}

export const LOGGER = new InjectionToken<LoggerBase[]>('LoggerBase');
