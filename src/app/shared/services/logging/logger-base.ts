import { InjectionToken } from '@angular/core';

export enum LogLevel {
  trace = 'trace',
  info = 'info',
  warn = 'warn',
  error = 'error'
}

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
