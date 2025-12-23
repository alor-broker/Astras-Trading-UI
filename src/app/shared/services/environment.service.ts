import { Injectable, inject } from '@angular/core';
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

export interface ExternalLinksConfig {
  reports?: string;
  releases?: string;
  support?: string;
  issuesList?: string;
  help?: string;
  officialSite?: string;
  riskRate?: string;
  personalAccount?: string;
  bankroll?: string;
  services?: string;
  videoTutorial?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private readonly localStorageService = inject(LocalStorageService);

  get apiUrl(): string {
    return this.getDebugStringRecord('apiUrl') ?? environment.apiUrl;
  }

  get wsUrl(): string {
    return this.getDebugStringRecord('wsUrl') ?? environment.wsUrl;
  }

  get cwsUrl(): string {
    return this.getDebugStringRecord('cwsUrl') ?? environment.cwsUrl;
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

  get cmsUrl(): string | undefined {
    return this.getDebugStringRecord('cmsUrl') ?? environment.cmsUrl;
  }

  get remoteSettingsStorageUrl(): string {
    return this.getDebugStringRecord('remoteSettingsStorageUrl') ?? environment.remoteSettingsStorageUrl;
  }

  get alorIconsStorageUrl(): string {
    return this.getDebugStringRecord('alorIconsStorageUrl') ?? environment.alorIconsStorageUrl;
  }

  get logging(): LoggingConfig {
    return environment.logging as unknown as LoggingConfig;
  }

  get externalLinks(): ExternalLinksConfig | undefined {
    return environment.externalLinks;
  }

  get features(): Record<string, boolean> {
    return environment.features;
  }

  get investIdeasApiUrl(): string {
    return environment.investIdeasApiUrl;
  }

  private getDebugStringRecord(key: string): string | null {
    return this.localStorageService.getStringItem(`debug.${key}`);
  }
}
