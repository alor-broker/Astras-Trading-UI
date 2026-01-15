import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { WebSocketSubject } from 'rxjs/webSocket';
import {
  BehaviorSubject,
  filter,
  interval,
  Observable,
  of,
  race,
  shareReplay,
  Subject,
  Subscription,
  switchMap,
  take,
  timer
} from 'rxjs';
import {BaseResponse} from '../models/ws/base-response.model';
import {ConfirmResponse} from '../models/ws/confirm-response.model';
import {GuidGenerator} from '../utils/guid';
import {
  catchError,
  finalize,
  map,
  takeWhile,
  tap
} from 'rxjs/operators';
import {isOnline$} from '../utils/network';
import {LoggerService} from './logging/logger.service';
import { EnvironmentService } from "./environment.service";
import {
  RXJS_WEBSOCKET_CTOR,
  WsOptions
} from "../constants/ws.constants";
import { ApiTokenProviderService } from "./auth/api-token-provider.service";

export interface SubscriptionRequest {
  opcode: string;
  repeatCount?: number;
}

type WsResponseMessage = BaseResponse<any> & ConfirmResponse;

interface WsRequestMessage extends SubscriptionRequest {
  guid: string;
}

interface SubscriptionState {
  messageSource: Subject<WsResponseMessage>;
  sharedStream$: Observable<any>;
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

@Injectable({
  providedIn: 'root'
})
export class SubscriptionsDataFeedService implements OnDestroy {
  private readonly environmentService = inject(EnvironmentService);
  private readonly apiTokenProviderService = inject(ApiTokenProviderService);
  private readonly logger = inject(LoggerService);
  private readonly webSocketFactory = inject(RXJS_WEBSOCKET_CTOR);
  private readonly ngZone = inject(NgZone);

  private socketState: SocketState | null = null;

  private readonly isConnected$ = new BehaviorSubject<boolean>(false);

  private readonly options = WsOptions;

  public getConnectionStatus(): Observable<boolean> {
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
    return this.ngZone.runOutsideAngular(() => {
      const socketState = this.getSocket();
      const subscriptionId = getSubscriptionId(request);

      const existingSubscription = socketState.subscriptionsMap.get(subscriptionId);
      if (!!existingSubscription) {
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
          }),
          map(x => x.data as R),
          shareReplay({bufferSize: Math.max(1, request.repeatCount ?? 1), refCount: true}),
        ),
        subscription: messageSubscription
      };

      socketState.subscriptionsMap.set(subscriptionId, subscriptionState);

      return subscriptionState.sharedStream$ as Observable<R>;
    });
  }

  private subscribeToMessages(source: Observable<WsResponseMessage>, target: Subject<any>, subscriptionId: string): Subscription {
    return source.subscribe({
      next: (value) => target.next(value),
      complete: () => this.logger.trace(this.toLoggerMessage(`${subscriptionId} COMPLETED`)),
      error: () => this.logger.trace(this.toLoggerMessage(`${subscriptionId} ERROR`)),
    });
  }

  private dropSubscription(socketState: SocketState, subscriptionId: string): void {
    this.ngZone.runOutsideAngular(() => {
      const state = socketState.subscriptionsMap.get(subscriptionId);

      if (state) {
        socketState.subscriptionsMap.delete(subscriptionId);
        state.subscription.unsubscribe();

        if (socketState.subscriptionsMap.size === 0) {
          socketState.isClosing = true;
        }
      }
    });
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
          } as any));
        } catch (err) {
          observer.error(err);
        }
      });

      const subscription = state.webSocketSubject?.subscribe({
        next: (value: WsResponseMessage) => {
          try {
            if((value.guid === request.guid && value.data != null)
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
            } as any));
          } catch (err) {
            observer.error(err);
          }
        });

        subscription?.unsubscribe();
      };
    });
  }

  private getSocket(): SocketState {
    return this.ngZone.runOutsideAngular(() => {
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
    });
  }

  private createWebSocketSubject(socketState: SocketState): WebSocketSubject<WsResponseMessage> {
    return this.webSocketFactory<WsResponseMessage>({
      url: this.environmentService.wsUrl,
      openObserver: {
        next: () => {
          this.logger.trace(this.toLoggerMessage('Connection open'));
          this.isConnected$.next(true);
        }
      },
      closeObserver: {
        next: (event: CloseEvent) => {
          if (socketState.subscriptionsMap.size > 0) {
            this.logger.warn(
              this.toLoggerMessage('Connection closed with active subscriptions'),
              JSON.stringify({
                code: event.code,
                reason: event.reason
              })
            );

            socketState.webSocketSubject?.complete();
            socketState.webSocketSubject = null;

            this.isConnected$.next(false);
            this.reconnect(socketState);

            return;
          }

          this.logger.info(this.toLoggerMessage('Connection closed'));
          this.clean(socketState);
        }
      }
    });
  }

  private isStateValid(state: SocketState): boolean {
    return !!state.webSocketSubject && !state.webSocketSubject.closed && !state.isClosing;
  }

  private initReconnectOnDisconnection(state: SocketState): void {
    if (!!state.offlineSub) {
      return;
    }

    state.offlineSub =
      isOnline$().pipe(
        filter(() => !this.isStateValid(state)),
        filter(isOnline => isOnline),
      ).subscribe(() => {
        this.reconnect(state);
      });
  }

  private initPingPong(state: SocketState): void {
    state.pingPongSub?.unsubscribe();

    const sendPing = (): Observable<WsResponseMessage | null> => {
      if(!this.isStateValid(state)) {
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
  }

  private getCurrentAccessToken(): Observable<string> {
    return this.apiTokenProviderService.getToken();
  }

  private reconnect(socketState: SocketState): void {
    if (socketState.reconnectSub) {
      return;
    }

    const reconnection$ = interval(this.options.reconnectTimeout)
      .pipe(
        takeWhile((v, index) => index < this.options.reconnectAttempts && !this.isStateValid(socketState)),
        finalize(() => {
          socketState.reconnectSub?.unsubscribe();
          socketState.reconnectSub = null;
        }),
        tap(attempt => this.logger.warn(this.toLoggerMessage(`Reconnection attempt #${attempt + 1}`)))
      );

    socketState.reconnectSub = reconnection$.subscribe(() => {
      socketState.webSocketSubject = this.createWebSocketSubject(socketState);
      socketState.subscriptionsMap.forEach((state, subscriptionId) => {
        this.logger.trace(this.toLoggerMessage(`Reconnect to ${subscriptionId}`));
        state.subscription = this.subscribeToMessages(this.createSubscription(state.request, socketState), state.messageSource, subscriptionId);
      });

      this.initPingPong(socketState);
    });
  }

  private toLoggerMessage(message: string): string {
    return `[SDF]: ${message}`;
  }

  ngOnDestroy(): void {
    if(this.socketState) {
      this.clean(this.socketState);
    }

    this.socketState = null;
    this.isConnected$.complete();
  }
}
