import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject, Subscription, interval, filter, take } from 'rxjs';
import { map, switchMap, takeWhile, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from "rxjs/webSocket";
import { environment } from 'src/environments/environment';
import { BaseRequest } from '../models/ws/base-request.model';
import { BaseResponse } from '../models/ws/base-response.model';
import { ConfirmResponse } from '../models/ws/confirm-response.model';
import { WsOptions } from '../models/ws/ws-options.model';
import { isOnline$ } from '../utils/network';
import { AuthService } from './auth.service';
import { LoggerService } from "./logger.service";

type WsMessage = BaseResponse<unknown> | BaseRequest | ConfirmResponse;

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  config: WebSocketSubjectConfig<WsMessage>;

  constructor(private account: AuthService, private logger: LoggerService) {
    this.options = {
      reconnect: true,
      reconnectTimeout: 2000,
      reconnectAttempts: 5
    };

    this.connectedSub = this.isConnected$.subscribe(isConnected => {
      if (this.options.reconnect && !isConnected) {
        this.reconnect();
      }
    });

    this.config = {
      url: environment.wsUrl,
      deserializer: ({data}) => JSON.parse(data),
      openObserver: {
        next: () => {
          this.isClosing.next(false);
          this.logger.info('[WS]: connection open');
        }
      },
      closeObserver: {
        next: () => {
          this.isClosing.next(true);
          this.logger.info('[WS]: connection closed');
          this.socket$?.complete();
          this.socket$ = null;
          this.reconnect();
        }
      },
    };
  }

  private socket$?: WebSocketSubject<WsMessage> | null;
  private subscriptions = new Map<string, BaseRequest>();
  private options: WsOptions;
  private reconnection$: Observable<number> | null = null;

  private messagesSubject$ = new Subject<BaseResponse<unknown>>();
  messages$ = this.messagesSubject$.asObservable();

  private connectedSub!: Subscription;
  private isClosing = new BehaviorSubject<boolean>(false);
  isConnected$ = isOnline$().pipe(
    switchMap(isOnline => this.isClosing.pipe(
      map(isClosing => isOnline && !isClosing)
    ))
  );

  connect(): void {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = webSocket(this.config);
      this.socket$.subscribe({
        next: (message) => {
          if (this.isBaseResponse(message)) {
            this.messagesSubject$.next(message);
          }
        },
        error: (error: Event) => {
          if (!this.socket$) {
              // run reconnect if errors
            this.logger.warn(
              '[WS]: connect error',
              JSON.stringify(error)
            );
          }
        }
      });

      for (const [, msg] of this.subscriptions) {
        this.executeWithCurrentAccessToken(token => {
          this.sendMessage(msg, token);
          this.logger.info(`[WS]: resubscribe to ${msg.opcode}`);
        });
      }
    }
  }

  subscribe(msg: BaseRequest) {
    if (this.subscriptions.has(msg.guid)) {
      return;
    }

    this.subscriptions.set(msg.guid, msg);

    this.executeWithCurrentAccessToken(token => {
      this.sendMessage(msg, token);
    });
  }

  unsubscribe(guid: string) {
    const msg: BaseRequest = {
      guid: guid,
      opcode: "unsubscribe",
      format: '',
      exchange: ''
    };

    this.executeWithCurrentAccessToken(token => {
      this.sendMessage(msg, token);
    });

    this.subscriptions.delete(guid);
  }

  private sendMessage(msg: BaseRequest, token: string) {
    this.socket$?.next(
      {
        ...msg,
        token: token
      }
    );
  }

  close() {
    this.socket$?.complete();
    this.connectedSub.unsubscribe();
  }

  private reconnect(): void {
    this.reconnection$ = interval(this.options.reconnectTimeout)
        .pipe(
          takeWhile((v, index) => index < this.options.reconnectAttempts && !this.socket$),
          tap(attempt =>this.logger.info('[WS] Reconnection attempt #' + attempt))
        );

    this.reconnection$.subscribe({
        next: () => {
          this.connect();
        },
        error: () => null,
        complete: () => {
            this.reconnection$ = null;

            if (!this.socket$) {
              this.close();
            }
        }});
  }

  private executeWithCurrentAccessToken(action: (token: string) => void) {
    this.account.accessToken$
      .pipe(
        filter(x => !!x),
        take(1)
      ).subscribe(token => {
        action(token);
    });
  }

  private isBaseResponse(msg: WsMessage): msg is BaseResponse<unknown> {
    return (msg as BaseResponse<unknown>).data !== undefined;
  }
}
