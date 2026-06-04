import {InjectionToken} from '@angular/core';
import {
  webSocket,
  WebSocketSubject,
  WebSocketSubjectConfig
} from 'rxjs/webSocket';

export const RXJS_WEBSOCKET_CTOR = new InjectionToken<typeof webSocket>(
  'rxjs/webSocket',
  {
    providedIn: 'root',
    factory: (): <T>(urlConfigOrSource: string | WebSocketSubjectConfig<T>) => WebSocketSubject<T> => webSocket,
  }
);

export const WsOptions = {
  reconnectTimeout: 2000,
  reconnectAttempts: 5,
  pingTimeout: 5000,
  pingLatency: 3000
};
