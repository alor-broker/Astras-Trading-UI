import { Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import { LocalStorageService } from "./local-storage.service";

export enum LogLevel {
  trace = 'trace',
  info = 'info',
  warn = 'warn',
  error = 'error'
}

export interface LoggerConfig {
  minLevel: LogLevel;
}

export interface RemoteLoggerConfig extends LoggerConfig {
  environment: 'local' | 'dev' | 'prod';
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

export interface ExternalLinksConfig {
  reports: string;
  releases: string;
  support: string;
  help: string;
  officialSite: string;
  riskRate: string;
  personalAccount: string;
  bankroll: string;
  services: string;
  videoTutorial: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  constructor(private readonly localStorageService: LocalStorageService) {
  }

  get apiUrl(): string {
    return this.getDebugStringRecord('apiUrl') ?? environment.apiUrl;
  }

  get wsUrl(): string {
    return this.getDebugStringRecord('wsUrl') ?? environment.wsUrl;
  }

  get clientDataUrl(): string {
    return this.getDebugStringRecord('clientDataUrl') ?? environment.clientDataUrl;
  }

  get ssoUrl(): string {
    return this.getDebugStringRecord('ssoUrl') ?? environment.ssoUrl;
  }

  get warpUrl(): string {
    return this.getDebugStringRecord('warpUrl') ?? environment.warpUrl;
  }

  get remoteSettingsStorageUrl(): string {
    return this.getDebugStringRecord('remoteSettingsStorageUrl') ?? environment.remoteSettingsStorageUrl;
  }

  get logging(): LoggingConfig {
    return environment.logging as unknown as LoggingConfig;
  }

  get externalLinks(): ExternalLinksConfig {
    return environment.externalLinks;
  }

  private getDebugStringRecord(key: string): string | null {
    return this.localStorageService.getStringItem(`debug.${key}`);
  }
}
