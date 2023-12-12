import { LoggerBase } from './logger-base';
import { Injectable } from '@angular/core';
import { GuidGenerator } from '../../utils/guid';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { LocalStorageService } from '../local-storage.service';
import {
  EnvironmentService,
  LogLevel,
  RemoteLoggerConfig
} from "../environment.service";
import { LocalStorageLoggingConstants } from "../../constants/local-storage.constants";

interface LogEntry {
  timestamp: string,
  logLevel: LogLevel,
  message: string,
  stack?: string,
  sessionId: string,
  login: string,
  device: string,
  browser: string,
  version: string,
  environment: 'local' | 'dev' | 'prod'
}
@Injectable({
  providedIn: "root"
})
export class RemoteLogger extends LoggerBase {
  private readonly buffer: LogEntry[] = [];
  private readonly guid = GuidGenerator.newGuid();
  private readonly flush = new Subject();
  private config?: RemoteLoggerConfig | null;

  constructor(
    private readonly localStorageService: LocalStorageService,
    private readonly httpClient: HttpClient,
    private readonly environmentService: EnvironmentService
  ) {
    super();

    this.flush
      .pipe(
        debounceTime(1)
      )
      .subscribe(() => {
          setTimeout(() => this.flushBuffer());
        }
      );
  }

  public isLoggerRequest(url: string) {
    const loggerUrl = this.getConfig()?.loggingServerUrl;

    if (!loggerUrl) {
      return false;
    }

    return url.startsWith(loggerUrl);
  }

  logMessage(logLevel: LogLevel, message: string, stack?: string): void {
    try {
      const config = this.getConfig();
      if (!config || !this.isLoggerEnabled(config)) {
        return;
      }

      if (!this.isLevelApplicable(config.minLevel, logLevel)) {
        return;
      }

      this.buffer.push(this.formatMessage(logLevel, message, stack));

      this.flush.next({});
    } catch (e) {
      console.error(e);
    }
  }

  private formatMessage(
    logLevel: LogLevel,
    message: string,
    stack?: string
  ): LogEntry {

    return {
      timestamp: new Date().toISOString(),
      logLevel: logLevel,
      message: message,
      stack: stack ?? '',
      sessionId: this.guid,
      login: this.localStorageService.getItem<string>(LocalStorageLoggingConstants.UserLoginStorageKey) ?? '',
      version: this.localStorageService.getItem<string>(LocalStorageLoggingConstants.AppVersionStorageKey) ?? '',
      device: this.localStorageService.getItem<string>(LocalStorageLoggingConstants.DeviceStorageKey) ?? '',
      browser: this.localStorageService.getItem<string>(LocalStorageLoggingConstants.BrowserStorageKey) ?? '',
      environment: this.getConfig()!.environment
    };
  }

  private flushBuffer() {
    try {
      const config = this.getConfig()!;

      do {
        const data = this.buffer.splice(0, 5);

        if (data.length === 0) {
          return;
        }

        const indexName = 'astras';

        const bulkData = data.reduce((previousValue, currentValue) => {
            return [
              ...previousValue,
              { index: { _index: indexName } },
              currentValue
            ];
          },
          [] as any[]
        );


        this.httpClient.post(
          `${config.loggingServerUrl}/_bulk`,
          bulkData.map(x => JSON.stringify(x)).join('\n') + '\n',
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${btoa(`${config.authorization.name}:${config.authorization.password}`)}`
            }
          }
        ).subscribe();
      } while (true);
    } catch (e) {
      console.error(e);
    }
  }
  private getConfig(): RemoteLoggerConfig | null {
    if (this.config === undefined) {
      this.config = this.environmentService.logging.remote ?? null;
    }

    return this.config;
  }

  private isLoggerEnabled(config: RemoteLoggerConfig | null): boolean {
    if(!config) {
      return false;
    }

    if(!config.authorization.name || !config.authorization.password) {
      console.warn('Remote logger is enabled but credentials are not configured');
      return false;
    }

    return true;
  }
}
