import {InjectionToken} from '@angular/core';

export interface RemoteStorageUrlProvider {
  get remoteSettingsStorageUrl(): string;
}

export const REMOTE_STORAGE_URL_PROVIDER = new InjectionToken<RemoteStorageUrlProvider>('RemoteStorageUrlProvider');
