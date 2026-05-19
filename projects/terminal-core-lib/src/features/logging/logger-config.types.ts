import {LogLevel} from './logger.types';
import {InjectionToken} from '@angular/core';

export interface LoggerConfig {
  minLevel: LogLevel;
}

export interface RemoteLoggerConfig extends LoggerConfig {
  environment: string;
  loggingServerUrl: string;
  authorization: {
    name: string;
    password: string;
  };
}

export interface LoggingConfig {
  console?: LoggerConfig;
  remote?: RemoteLoggerConfig;
}

export const LOGGING_CONFIG = new InjectionToken<LoggingConfig>('LoggingConfig');
