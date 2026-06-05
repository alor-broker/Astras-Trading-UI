import {
  inject,
  Injectable,
  OnDestroy
} from "@angular/core";
import {WEB_SOCKET_DATA_URL_PROVIDER} from '../../../config/api-url-providers';
import {LoggerService} from '../../logging/services/logger-service';
import {ApiTokenProviderService} from '../../http-requests/services/api-token-provider.service';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  finalize,
  interval,
  map,
  Observable,
  of,
  race,
  shareReplay,
  Subject,
  Subscription,
  switchMap,
  take,
  takeWhile,
  tap,
  timer
} from "rxjs";
import {WebSocketSubject} from 'rxjs/webSocket';
import {
  RXJS_WEBSOCKET_CTOR,
  WsOptions
} from '../../../common/constants/web-socket.constants';
import {ApplicationStatusService} from '../../../common/services/application-status.service';
import {DeviceNetworkService} from '../../../common/services/device-network.service';
import {GuidGenerator} from '../../../common/utils/guid-generator';
import {
  BaseResponse,
  ConfirmResponse
} from '../../../common/types/web-socket.types';
import {NetworkStatusProvider} from '@terminal-core-lib/features/network-indicator/services/network-status-service.types';

export interface SubscriptionRequest {
  opcode: string;
  repeatCount?: number;
}

type WsResponseMessage = Partial<BaseResponse<unknown>> & Partial<ConfirmResponse> & Record<string, unknown>;

interface WsRequestMessage extends SubscriptionRequest {
  guid: string;
}

interface SubscriptionState {
  messageSource: Subject<WsResponseMessage>;
  sharedStream$: Observable<unknown>;
  request: WsRequestMessage;
  subscription: Subscription;
}

interface SocketState {
  readonly socketId: string;
  readonly subscriptionsMap: Map<string, SubscriptionState>;
  webSocketSubject: WebSocketSubject<WsResponseMessage> | null;
  isClosing: boolean;
  reconnectSub: Subscription | null;

  offlineSub: Subscription | null;
  pingPongSub: Subscription | null;
}

@Injectable({providedIn: 'root'})
export class SubscriptionsDataFeedService implements NetworkStatusProvider, OnDestroy {
  private readonly webSocketDataUrlProvider = inject(WEB_SOCKET_DATA_URL_PROVIDER);

  private readonly apiTokenProviderService = inject(ApiTokenProviderService);

  private readonly logger = inject(LoggerService);

  private readonly webSocketFactory = inject(RXJS_WEBSOCKET_CTOR);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly deviceNetworkService = inject(DeviceNetworkService);

  private socketState: SocketState | null = null;

  private readonly isConnected$ = new BehaviorSubject<boolean>(false);

  private readonly options = WsOptions;

  isOnline(): Observable<boolean> {
    return this.isConnected$.pipe(
      map(x => {
        if (!this.socketState) {
          return true;
        }

        return x;
      })
    );
  }

  public subscribe<T extends SubscriptionRequest, R>(request: T, getSubscriptionId: (request: T) => string): Observable<R> {
    const socketState = this.getSocket();
    const subscriptionId = getSubscriptionId(request);

    const existingSubscription = socketState.subscriptionsMap.get(subscriptionId);
    if (existingSubscription) {
      return existingSubscription.sharedStream$ as Observable<R>;
    }

    const requestMessage: WsRequestMessage = {
      ...request,
      guid: GuidGenerator.newGuid()
    };

    const subject = new Subject<WsResponseMessage>();
    const messageSubscription = this.subscribeToMessages(this.createSubscription(requestMessage, socketState), subject, subscriptionId);

    const subscriptionState: SubscriptionState = {
      request: requestMessage,
      messageSource: subject,
      sharedStream$: subject.pipe(
        finalize(() => {
          this.dropSubscription(socketState, subscriptionId);
          subject.complete();
        }),
        map(x => x.data as R),
        shareReplay({bufferSize: Math.max(1, request.repeatCount ?? 1), refCount: true}),
      ),
      subscription: messageSubscription
    };

    socketState.subscriptionsMap.set(subscriptionId, subscriptionState);

    return subscriptionState.sharedStream$ as Observable<R>;
  }

  ngOnDestroy(): void {
    if (this.socketState) {
      this.clean(this.socketState);
    }

    this.socketState = null;
    this.isConnected$.complete();
  }

  private subscribeToMessages(source: Observable<WsResponseMessage>, target: Subject<WsResponseMessage>, subscriptionId: string): Subscription {
    return source.subscribe({
      next: (value) => target.next(value),
      complete: () => this.logger.debug(this.toLoggerMessage(`${subscriptionId} COMPLETED`)),
      error: () => this.logger.debug(this.toLoggerMessage(`${subscriptionId} ERROR`)),
    });
  }

  private dropSubscription(socketState: SocketState, subscriptionId: string): void {
    const state = socketState.subscriptionsMap.get(subscriptionId);

    if (state) {
      socketState.subscriptionsMap.delete(subscriptionId);
      state.subscription.unsubscribe();
      state.messageSource.complete();

      if (socketState.subscriptionsMap.size === 0) {
        socketState.isClosing = true;
      }
    }
  }

  private createSubscription(request: WsRequestMessage, state: SocketState, enableConfirmResponse = false): Observable<WsResponseMessage> {
    return new Observable<WsResponseMessage>(observer => {
      this.getCurrentAccessToken().pipe(
        take(1),
      ).subscribe(token => {
        try {
          state.webSocketSubject?.next(({
            ...request,
            token
          }));
        } catch (err) {
          observer.error(err);
        }
      });

      const subscription = state.webSocketSubject?.subscribe({
        next: (value: WsResponseMessage) => {
          try {
            if ((value.guid === request.guid && value.data != null)
              || (enableConfirmResponse && value.requestGuid === request.guid)) {
              observer.next(value);
            }
          } catch (err) {
            observer.error(err);
          }
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });

      return () => {
        this.getCurrentAccessToken().pipe(
          take(1),
        ).subscribe(token => {
          try {
            state.webSocketSubject?.next(({
              opcode: 'unsubscribe',
              guid: request.guid,
              token: token
            }));
          } catch (err) {
            observer.error(err);
          }
        });

        subscription?.unsubscribe();
      };
    });
  }

  private getSocket(): SocketState {
    if (!!this.socketState && this.isStateValid(this.socketState)) {
      return this.socketState;
    }

    const socketState: SocketState = {
      socketId: GuidGenerator.newGuid(),
      isClosing: false,
      subscriptionsMap: new Map<string, SubscriptionState>(),
      webSocketSubject: null,
      reconnectSub: null,
      offlineSub: null,
      pingPongSub: null
    };

    socketState.webSocketSubject = this.createWebSocketSubject(socketState);

    this.initReconnectOnDisconnection(socketState);
    this.initPingPong(socketState);

    this.socketState = socketState;

    return socketState;
  }

  private createWebSocketSubject(socketState: SocketState): WebSocketSubject<WsResponseMessage> {
    return this.webSocketFactory<WsResponseMessage>({
      url: this.webSocketDataUrlProvider.wsUrl,
      openObserver: {
        next: () => {
          this.logger.info(this.toLoggerMessage('Connection open'));
          this.isConnected$.next(true);
        }
      },
      closeObserver: {
        next: (event: CloseEvent) => {
          if (socketState.subscriptionsMap.size > 0) {
            this.logger.debug(`${this.toLoggerMessage('Connection closed with active subscriptions')}, ${JSON.stringify({
              code: event.code,
              reason: event.reason
            })}`);

            socketState.webSocketSubject?.complete();
            socketState.webSocketSubject = null;

            this.isConnected$.next(false);
            this.reconnect(socketState);

            return;
          }

          this.logger.debug(this.toLoggerMessage('Connection closed'));
          this.clean(socketState);
        }
      }
    });
  }

  private isStateValid(state: SocketState): boolean {
    return !!state.webSocketSubject && !state.webSocketSubject.closed && !state.isClosing;
  }

  private initReconnectOnDisconnection(state: SocketState): void {
    if (state.offlineSub) {
      return;
    }

    state.offlineSub = combineLatest({
        isOnline: this.deviceNetworkService.isOnline$,
        isAppActive: this.applicationStatusService.isActive$
      }
    ).pipe(
      filter(() => !this.isStateValid(state)),
      filter(x => x.isOnline && x.isAppActive),
    ).subscribe(() => {
      this.reconnect(state);
    });
  }

  private initPingPong(state: SocketState): void {
    state.pingPongSub?.unsubscribe();

    const sendPing = (): Observable<WsResponseMessage | null> => {
      if (!this.isStateValid(state)) {
        return of(null);
      }

      return this.createSubscription(
        {
          guid: GuidGenerator.newGuid(),
          opcode: 'ping',
          confirm: true
        } as WsRequestMessage,
        state,
        true
      );
    };

    const readPong = (): Observable<WsResponseMessage | null> => race([
      sendPing(),
      timer(this.options.pingLatency).pipe(map(() => null)),
    ]).pipe(
      catchError(() => of(null))
    );

    state.pingPongSub = timer(this.options.pingTimeout, this.options.pingTimeout).pipe(
      switchMap(() => readPong()),
      filter(() => this.isStateValid(state))
    ).subscribe(x => {
      this.isConnected$.next(!!x);
    });
  }

  private clean(state: SocketState): void {
    state.reconnectSub?.unsubscribe();
    state.offlineSub?.unsubscribe();
    state.pingPongSub?.unsubscribe();
    state.subscriptionsMap.forEach(subscriptionState => {
      subscriptionState.subscription.unsubscribe();
      subscriptionState.messageSource.complete();
    });
    state.subscriptionsMap.clear();
  }

  private getCurrentAccessToken(): Observable<string> {
    return this.apiTokenProviderService.getToken();
  }

  private reconnect(socketState: SocketState): void {
    if (socketState.reconnectSub || !this.applicationStatusService.isActive) {
      return;
    }

    const reconnection$ = interval(this.options.reconnectTimeout)
      .pipe(
        takeWhile((v, index) => index < this.options.reconnectAttempts && !this.isStateValid(socketState)),
        finalize(() => {
          socketState.reconnectSub?.unsubscribe();
          socketState.reconnectSub = null;
        }),
        tap(attempt => this.logger.debug(this.toLoggerMessage(`Reconnection attempt #${attempt + 1}`)))
      );

    socketState.reconnectSub = reconnection$.subscribe(() => {
      socketState.webSocketSubject = this.createWebSocketSubject(socketState);
      socketState.subscriptionsMap.forEach((state, subscriptionId) => {
        this.logger.debug(this.toLoggerMessage(`Reconnect to ${subscriptionId}`));
        state.subscription = this.subscribeToMessages(this.createSubscription(state.request, socketState), state.messageSource, subscriptionId);
      });

      this.initPingPong(socketState);
    });
  }

  private toLoggerMessage(message: string): string {
    return `[SDF]: ${message}`;
  }
}
