import {
  Inject,
  Injectable,
  InjectionToken
} from '@angular/core';
import {
  webSocket,
  WebSocketSubject
} from 'rxjs/webSocket';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';
import {
  filter,
  interval,
  Observable,
  shareReplay,
  Subject,
  Subscription,
  switchMap,
  take
} from 'rxjs';
import { BaseResponse } from '../models/ws/base-response.model';
import { ConfirmResponse } from '../models/ws/confirm-response.model';
import { environment } from '../../../environments/environment';
import { GuidGenerator } from '../utils/guid';
import {
  finalize,
  map,
  takeWhile,
  tap
} from 'rxjs/operators';
import { isOnline$ } from '../utils/network';

export interface SubscriptionRequest {
  opcode: string;
}

type WsResponseMessage = BaseResponse<any> & ConfirmResponse;

interface WsRequestMessage extends SubscriptionRequest {
  guid: string;
}

interface SubscriptionState {
  messageSource: Subject<WsResponseMessage>,
  sharedStream$: Observable<any>,
  request: WsRequestMessage,
  subscription: Subscription
}

export const RXJS_WEBSOCKET_CTOR = new InjectionToken<typeof webSocket>(
  'rxjs/webSocket',
  {
    providedIn: 'root',
    factory: () => webSocket,
  }
);

@Injectable({
  providedIn: 'root'
})
export class SubscriptionsDataFeedService {
  private webSocketSubject?: WebSocketSubject<WsResponseMessage> | null;

  private readonly subscriptionsMap = new Map<string, SubscriptionState>();

  private readonly options = {
    reconnectTimeout: 2000,
    reconnectAttempts: 5
  };

  private reconnection$: Observable<number> | null = null;
  private reconnectSub: Subscription | null = null;
  private offlineSub: Subscription | null = null;

  constructor(
    private accountService: AuthService,
    private logger: LoggerService,
    @Inject(RXJS_WEBSOCKET_CTOR) private webSocketFactory: typeof webSocket
  ) {
  }

  public subscribe<T extends SubscriptionRequest, R>(request: T, getSubscriptionId: (request: T) => string): Observable<R> {
    const subscriptionId = getSubscriptionId(request);

    const existingSubscription = this.subscriptionsMap.get(subscriptionId);
    if (!!existingSubscription) {
      return existingSubscription.sharedStream$;
    }

    const requestMessage: WsRequestMessage = {
      ...request,
      guid: GuidGenerator.newGuid()
    };

    const subject = new Subject<any>();
    const messageSubscription = this.subscribeToMessages(this.createSubscription(requestMessage), subject, subscriptionId);

    const subscriptionState: SubscriptionState = {
      request: requestMessage,
      messageSource: subject,
      sharedStream$: subject.pipe(
        finalize(() => {
          this.dropSubscription(subscriptionId);
        }),
        map(x => x.data as R),
        shareReplay({ bufferSize: 1, refCount: true })
      ),
      subscription: messageSubscription
    };

    this.subscriptionsMap.set(subscriptionId, subscriptionState);

    return subscriptionState.sharedStream$;
  }

  private subscribeToMessages(source: Observable<WsResponseMessage>, target: Subject<any>, subscriptionId: string): Subscription {
    return source.subscribe({
      next: (value) => target.next(value),
      complete: () => this.logger.trace(this.toLoggerMessage(`${subscriptionId} COMPLETED`)),
      error: () => this.logger.trace(this.toLoggerMessage(`${subscriptionId} ERROR`)),
    });
  }

  private dropSubscription(subscriptionId: string) {
    const state = this.subscriptionsMap.get(subscriptionId);

    if (state) {
      this.subscriptionsMap.delete(subscriptionId);
      state.subscription.unsubscribe();
    }
  }

  private createSubscription(request: WsRequestMessage): Observable<WsResponseMessage> {
    this.initWebSocket();

    return this.getCurrentAccessToken().pipe(
      take(1),
      switchMap(token => {
        return this.webSocketSubject!.multiplex(
          () => ({
            ...request,
            token
          }),
          () => ({
            opcode: 'unsubscribe',
            guid: request.guid,
            token: token
          }),
          (value) => value.guid === request.guid && !!value.data
        );
      })
    );
  }

  private initWebSocket() {
    if (!!this.webSocketSubject && !this.webSocketSubject.closed) {
      return;
    }

    this.webSocketSubject = this.webSocketFactory<WsResponseMessage>({
      url: environment.wsUrl,
      openObserver: {
        next: () => {
          this.logger.trace(this.toLoggerMessage('Connection open'));
          this.reconnectSub?.unsubscribe();
          this.reconnection$ = null;
        }
      },
      closeObserver: {
        next: (event) => {
          this.webSocketSubject = null;

          if (this.subscriptionsMap.size > 0) {
            this.logger.warn(
              this.toLoggerMessage('Connection closed with active subscriptions'),
              JSON.stringify(event)
            );

            this.reconnect();

            return;
          }

          this.logger.info(this.toLoggerMessage('Connection closed'));
          this.clean();
        }
      }
    });

    this.initReconnectOnDisconnection();
  }

  private initReconnectOnDisconnection() {
    if (!!this.offlineSub) {
      return;
    }

    this.offlineSub =
      isOnline$().pipe(
        filter(() => !this.webSocketSubject || this.webSocketSubject.closed),
        filter(isOnline => isOnline),
      ).subscribe(() => {
        this.reconnect();
      });
  }

  private clean() {
    this.offlineSub?.unsubscribe();
    this.offlineSub = null;
  }

  private getCurrentAccessToken(): Observable<string> {
    return this.accountService.accessToken$
      .pipe(
        filter(x => !!x)
      );
  }

  private reconnect() {
    if (this.reconnection$) {
      return;
    }

    this.webSocketSubject?.complete();
    this.webSocketSubject = null;

    this.reconnectSub?.unsubscribe();

    this.reconnection$ = interval(this.options.reconnectTimeout)
      .pipe(
        takeWhile((v, index) => index < this.options.reconnectAttempts && !this.webSocketSubject),
        finalize(() => this.reconnection$ = null),
        tap(attempt => this.logger.warn(this.toLoggerMessage('Reconnection attempt #' + (attempt + 1))))
      );

    this.reconnectSub = this.reconnection$.subscribe(() => {
      this.subscriptionsMap.forEach((state, subscriptionId) => {
        this.logger.trace(this.toLoggerMessage(`Reconnect to ${subscriptionId}`));
        state.subscription = this.subscribeToMessages(this.createSubscription(state.request), state.messageSource, subscriptionId);
      });
    });
  }

  private toLoggerMessage(message: string): string {
    return `[SDF]: ${message}`;
  }
}
