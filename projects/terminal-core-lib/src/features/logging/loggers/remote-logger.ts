import {LoggerBase} from './logger.types';
import {
  inject,
  Injectable
} from '@angular/core';
import {LocalStorageService} from '../../local-storage/local-storage.service';
import {
  HttpClient,
  HttpContext
} from '@angular/common/http';
import {
  LOGGING_CONFIG,
  LoggingConfig,
  RemoteLoggerConfig
} from '../logger-config.types';
import {LogLevel} from "../logger.types";
import {GuidGenerator} from '../../../common/utils/guid-generator';
import {
  catchError,
  debounceTime,
  of,
  Subject
} from 'rxjs';
import {LocalStorageLoggingConstants} from '../../local-storage/local-storage.constants';
import {HttpContextTokens} from '../../http-requests/constants/http.constants';

interface LogEntry {
  timestamp: string;
  timestampUtc: number;
  logLevel: LogLevel;
  message: string;
  stack?: string;
  sessionId: string;
  login: string;
  clientId: string;
  device: string;
  browser: string;
  version: string;
  environment: string;
}

@Injectable()
export class RemoteLogger extends LoggerBase {
  private readonly localStorageService = inject(LocalStorageService);

  private readonly httpClient = inject(HttpClient);

  private readonly loggingConfig = inject<LoggingConfig>(LOGGING_CONFIG);

  private readonly duplicatedMessagesLatencyMs = 1000;

  private readonly buffer: LogEntry[] = [];

  private readonly guid = GuidGenerator.newGuid();

  private readonly flush = new Subject();

  private config?: RemoteLoggerConfig | null;

  private lastLoggedMessage: LogEntry | null = null;

  constructor() {
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

  logMessage(logLevel: LogLevel, message: string, stack?: string): void {
    try {
      const config = this.getConfig();
      if (!config || !this.isLoggerEnabled(config)) {
        return;
      }

      if (!this.isLevelApplicable(config.minLevel, logLevel)) {
        return;
      }

      const logEntry = this.formatMessage(logLevel, message, stack);
      if (!this.shouldIgnoreMessage(logEntry)) {
        this.buffer.push(logEntry);
      }

      this.lastLoggedMessage = logEntry;
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
    const entryDate = new Date();
    return {
      timestamp: entryDate.toISOString(),
      timestampUtc: entryDate.getTime(),
      logLevel: logLevel,
      message: message,
      stack: stack ?? '',
      sessionId: this.guid,
      login: this.localStorageService.getStringItem(LocalStorageLoggingConstants.UserLoginStorageKey) ?? '',
      clientId: this.localStorageService.getStringItem(LocalStorageLoggingConstants.ClientIdStorageKey) ?? '',
      version: this.localStorageService.getStringItem(LocalStorageLoggingConstants.AppVersionStorageKey) ?? '',
      device: this.localStorageService.getStringItem(LocalStorageLoggingConstants.DeviceStorageKey) ?? '',
      browser: this.localStorageService.getStringItem(LocalStorageLoggingConstants.BrowserStorageKey) ?? '',
      environment: this.getConfig()!.environment
    };
  }

  private flushBuffer(): void {
    try {
      const config = this.getConfig()!;

      while (this.buffer.length > 0) {
        const data = this.buffer.splice(0, 5);

        if (data.length === 0) {
          return;
        }

        const indexName = 'astras';

        const bulkData = data.reduce((previousValue, currentValue) => {
            return [
              ...previousValue,
              {index: {_index: indexName}},
              currentValue
            ];
          },
          [] as (LogEntry | { index: { _index: string } })[]
        );

        this.httpClient.post(
          `${config.loggingServerUrl}/_bulk`,
          bulkData.map(x => JSON.stringify(x)).join('\n') as string + '\n',
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${btoa(`${config.authorization.name}:${config.authorization.password}`)}`
            },
            context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true)
          }
        ).pipe(
          catchError(() => of(null))
        )
          .subscribe();
      }
    } catch (e) {
      console.error(e);
    }
  }

  private getConfig(): RemoteLoggerConfig | null {
    if (this.config === undefined) {
      this.config = this.loggingConfig.remote ?? null;
    }

    return this.config;
  }

  private isLoggerEnabled(config: RemoteLoggerConfig | null): boolean {
    if (!config) {
      return false;
    }

    if (!config.authorization.name || !config.authorization.password) {
      console.warn('Remote logger is enabled but credentials are not configured');
      return false;
    }

    return true;
  }

  private shouldIgnoreMessage(entry: LogEntry): boolean {
    if (!this.lastLoggedMessage) {
      return false;
    }

    return entry.logLevel === this.lastLoggedMessage.logLevel
      && entry.message === this.lastLoggedMessage.message
      && (entry.stack ?? '') === (this.lastLoggedMessage.stack ?? '')
      && (entry.timestampUtc - this.lastLoggedMessage.timestampUtc) < this.duplicatedMessagesLatencyMs;
  }
}
