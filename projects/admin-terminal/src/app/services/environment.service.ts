import {
  inject,
  Injectable
} from "@angular/core";
import {LocalStorageService} from "@terminal-core-lib/features/local-storage/local-storage.service";
import {environment} from '../../environments/environment';
import {LoggingConfig} from '@terminal-core-lib/features/logging/logger-config.types';
import {ExternalLinksConfig} from '@terminal-core-lib/features/external-links/external-links.types';

@Injectable()
export class EnvironmentService {
  private readonly localStorageService = inject(LocalStorageService);

  get production(): boolean {
    return environment.production;
  }

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

  get debug(): Record<string, boolean> {
    return environment.debug;
  }

  get investIdeasApiUrl(): string {
    return environment.investIdeasApiUrl;
  }

  private getDebugStringRecord(key: string): string | null {
    return this.localStorageService.getStringItem(`debug.${key}`);
  }
}
