import {
  Inject,
  Injectable,
  OnDestroy
} from "@angular/core";
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  interval,
  Observable,
  of,
  race,
  shareReplay,
  Subscription,
  switchMap,
  take,
  tap,
  timer
} from "rxjs";
import {
  catchError,
  finalize,
  map,
  takeWhile,
} from "rxjs/operators";
import {
  webSocket,
  WebSocketSubject
} from "rxjs/webSocket";
import {
  RXJS_WEBSOCKET_CTOR,
  WsOptions
} from "../../../shared/constants/ws.constants";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { ApiTokenProviderService } from "../../../shared/services/auth/api-token-provider.service";
import { LoggerService } from "../../../shared/services/logging/logger.service";
import { GuidGenerator } from "../../../shared/utils/guid";
import { isOnline$ } from "../../../shared/utils/network";

export interface CommandRequest {
  opcode: string;
}

export interface ConfirmResponse {
  requestGuid: string;
  httpCode: number;
  message: string;
}

export interface CommandResponse extends ConfirmResponse {
  orderNumber?: string;
}

type WsResponseMessage = ConfirmResponse | CommandResponse;

interface SocketState {
  webSocketSubject: WebSocketSubject<WsResponseMessage> | null;
  subjectTearDown: Subscription | null;
  authorizationCheck$: Observable<Record<string, never>> | null;
  isClosing: boolean;
  reconnectSub: Subscription | null;
  offlineSub: Subscription | null;
  pingPongSub: Subscription | null;
}

interface WsRequestMessage {
  opcode: string;
  guid: string;
}

@Injectable({
  providedIn: 'root'
})
export class WsOrdersConnector implements OnDestroy {
  private readonly isConnected$ = new BehaviorSubject<boolean>(false);
  private socketState: SocketState | null = null;

  private readonly options = {
    ...WsOptions,
    pingTimeout: WsOptions.pingTimeout * 2
  };

  private readonly lastRequestDelayMSec$ = new BehaviorSubject<number | null>(null);

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly apiTokenProviderService: ApiTokenProviderService,
    private readonly logger: LoggerService,
    @Inject(RXJS_WEBSOCKET_CTOR) private readonly webSocketFactory: typeof webSocket
  ) {
  }

  get lastOrderDelayMSec$(): Observable<number> {
    return this.lastRequestDelayMSec$.pipe(
      filter((x): x is number => x != null)
    );
  }

  getConnectionStatus(): Observable<boolean> {
    return this.isConnected$.pipe(
      map(x => {
        if (!this.socketState) {
          return true;
        }

        return x;
      })
    );
  }

  ngOnDestroy(): void {
    if (this.socketState != null) {
      this.socketState.subjectTearDown?.unsubscribe();
      this.socketState.reconnectSub?.unsubscribe();
      this.socketState.offlineSub?.unsubscribe();
      this.socketState.pingPongSub?.unsubscribe();
    }

    this.isConnected$.complete();
    this.lastRequestDelayMSec$.complete();
  }

  warmUp(): void {
    this.getSocketState();
  }

  submitCommand<T extends CommandRequest>(request: T): Observable<CommandResponse> {
    const socketState = this.getSocketState();
    if (!this.isStateValid(socketState)) {
      this.reconnect(socketState);

      return of({
        httpCode: -1,
        message: 'Connection is terminated',
        requestGuid: ''
      });
    }

    let startTime: number;

    return of(Date.now()).pipe(
      tap(st => startTime = st),
      switchMap(() => this.sendMessageWithAuthorization({
        ...request,
        guid: GuidGenerator.newGuid()
      }, socketState)),
      tap(() => {
        this.lastRequestDelayMSec$.next(Date.now() - startTime);
      })
    );
  }

  private getCurrentAccessToken(): Observable<string> {
    return this.apiTokenProviderService.getToken();
  }

  private toLoggerMessage(message: string): string {
    return `[CWS]: ${message}`;
  }

  private isStateValid(state: SocketState): boolean {
    return !!state.webSocketSubject && !state.webSocketSubject.closed && !state.isClosing;
  }

  private createWebSocketSubject(socketState: SocketState): WebSocketSubject<WsResponseMessage> {
    socketState.subjectTearDown?.unsubscribe();
    socketState.subjectTearDown = new Subscription();
    socketState.authorizationCheck$ = null;
    socketState.isClosing = false;

    const subject = this.webSocketFactory<WsResponseMessage>({
      url: this.environmentService.cwsUrl,
      openObserver: {
        next: () => {
          this.logger.trace(this.toLoggerMessage('Connection open'));
          this.isConnected$.next(true);
        }
      },
      closeObserver: {
        next: (event: CloseEvent) => {
          this.logger.warn(
            this.toLoggerMessage('Connection closed'),
            JSON.stringify({
              code: event.code,
              reason: event.reason
            })
          );

          socketState.isClosing = true;
          this.reconnect(socketState);
        }
      }
    });

    // subject should have at least one subscriber to prevent connection closing
    socketState.subjectTearDown?.add(subject.subscribe());

    return subject;
  }

  private initPingPong(state: SocketState): void {
    state.pingPongSub?.unsubscribe();

    const sendPing = (): Observable<WsResponseMessage | null> => {
      if (!this.isStateValid(state)) {
        return of(null);
      }

      return this.sendMessageWithAuthorization(
        {
          guid: GuidGenerator.newGuid(),
          opcode: 'ping',
          confirm: true
        } as WsRequestMessage,
        state
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

  private sendBaseMessage<T extends WsRequestMessage>(request: T, webSocketSubject: WebSocketSubject<WsResponseMessage> | null): Observable<WsResponseMessage> {
    return new Observable<WsResponseMessage>(observer => {
      const subscription = webSocketSubject?.subscribe({
        next: (value: WsResponseMessage) => {
          try {
            if ((value.requestGuid === request.guid)) {
              observer.next(value);
              observer.complete();
            }
          } catch (err) {
            observer.error(err);
          }
        },
        error: (err) => {
          observer.error(err);
        },
        complete: () => {
          observer.complete();
        },
      });

      try {
        webSocketSubject?.next(({
          ...request
        } as any));
      } catch (err) {
        observer.error(err);
      }

      return () => {
        subscription?.unsubscribe();
      };
    });
  }

  private sendMessageWithAuthorization<T extends WsRequestMessage>(request: T, socketState: SocketState): Observable<WsResponseMessage> {
    if (socketState.authorizationCheck$ == null) {
      socketState.authorizationCheck$ = this.getCurrentAccessToken().pipe(
        distinctUntilChanged(),
        filter(x => !!x),
        switchMap(t => this.sendBaseMessage(
            {
              guid: GuidGenerator.newGuid(),
              opcode: 'authorize',
              token: t,
              originator: 'astras'
            },
            socketState.webSocketSubject
          )
        ),
        map(() => ({})),
        shareReplay(1)
      );
    }

    return socketState.authorizationCheck$.pipe(
      switchMap(() => this.sendBaseMessage(request, socketState.webSocketSubject)),
      take(1),
    );
  }

  private getSocketState(): SocketState {
    if (!!this.socketState) {
      return this.socketState;
    }

    const socketState: SocketState = {
      isClosing: false,
      webSocketSubject: null,
      reconnectSub: null,
      offlineSub: null,
      pingPongSub: null,
      authorizationCheck$: null,
      subjectTearDown: null
    };

    socketState.webSocketSubject = this.createWebSocketSubject(socketState);

    this.initReconnectOnDisconnection(socketState);
    this.initPingPong(socketState);

    this.socketState = socketState;

    return socketState;
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
      this.initPingPong(socketState);
    });
  }
}
