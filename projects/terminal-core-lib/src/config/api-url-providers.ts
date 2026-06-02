import {InjectionToken} from '@angular/core';

export interface ClientDataUrlsProvider {
  get clientDataUrl(): string;

  get ssoUrl(): string;
}

export const CLIENT_DATA_URLS_PROVIDER = new InjectionToken<ClientDataUrlsProvider>('ClientDataUrlsProvider');

export interface CoreApiUrlProvider {
  get apiUrl(): string;
}

export const CORE_API_URL_PROVIDER = new InjectionToken<CoreApiUrlProvider>('CoreApiUrlProvider');

export interface ReleasesUrlProvider {
  get releasesApi(): string;
}

export const RELEASES_API_URL_PROVIDER = new InjectionToken<ReleasesUrlProvider>('ReleasesUrlProvider');

export interface IconsStorageUrlProvider {
  get iconsStorageUrl(): string;
}

export const ICONS_STORAGE_URL_PROVIDER = new InjectionToken<IconsStorageUrlProvider>('IconsStorageUrlProvider');

export interface WebSocketDataUrlProvider {
  get wsUrl(): string;
}

export const WEB_SOCKET_DATA_URL_PROVIDER = new InjectionToken<WebSocketDataUrlProvider>('WebSocketDataUrlProvider');

export interface WebSocketOrdersUrlProvider {
  get cwsUrl(): string;
}

export const WEB_SOCKET_ORDERS_URL_PROVIDER = new InjectionToken<WebSocketOrdersUrlProvider>('WebSocketOrdersUrlProvider');

export interface UrgentNotificationsUrlProvider {
  get urgentNotificationsUrl(): string | null | undefined;
}

export const URGENT_NOTIFICATIONS_URL_PROVIDER = new InjectionToken<UrgentNotificationsUrlProvider>('UrgentNotificationsUrlProvider');
