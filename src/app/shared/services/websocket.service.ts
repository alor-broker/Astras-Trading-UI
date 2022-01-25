import { Injectable } from '@angular/core';
import { Subject, EMPTY, Observable, timer, BehaviorSubject, merge, fromEvent, of, Subscription, interval } from 'rxjs';
import { catchError, delayWhen, filter, map, retryWhen, switchAll, switchMap, takeWhile, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from "rxjs/webSocket";
import { environment } from 'src/environments/environment';
import { BaseRequest } from '../models/ws/base-request.model';
import { BaseResponse } from '../models/ws/base-response.model';
import { ConfirmResponse } from '../models/ws/confirm-response.model';
import { WsOptions } from '../models/ws/ws-options.model';
import { isOnline$ } from '../utils/network';
import { AuthService } from './auth.service';

const RECONNECT_INTERVAL = 2000;

type WsMessage = BaseResponse<unknown> | BaseRequest | ConfirmResponse;

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  config: WebSocketSubjectConfig<WsMessage>;
  token = new BehaviorSubject<string | null>(null);

  constructor(private account: AuthService) {
    this.options = {
      reconnect: true,
      reconnectTimeout: 2000,
      reconnectAttempts: 5
    }
    this.account.accessToken$.subscribe(t => {
      this.token.next(t);
    });

    this.connectedSub = this.isConnected$.subscribe(isConnected => {
      if (this.options.reconnect && !isConnected) {
        this.reconnect();
      }
    });
    this.config = {
      url: environment.wsUrl,
      serializer: msg => JSON.stringify({
        ...msg,
        token: this.token.getValue()
      }),
      deserializer: ({data}) => JSON.parse(data),
      openObserver: {
        next: () => {
          this.isClosing.next(false);
          console.log('[WS]: connection open');
        }
      },
      closeObserver: {
        next: (v) => {
          this.isClosing.next(true);
          console.log('[WS]: connection closed');
          this.socket$?.complete();
          this.socket$ = null;
          this.reconnect();
        }
      },
    };
  }
  // @ts-ignore: Property has no initializer and is not definitely assigned
  private socket$: WebSocketSubject<WsMessage> | null;
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
      this.socket$.subscribe(
        (message) => {
          if (this.isBaseResponse(message)) {
            this.messagesSubject$.next(message);
          }
        },
        (error: Event) => {
          if (!this.socket$) {
              // run reconnect if errors
              console.log('connect error')
              console.log(error);
          }
        });

      for (const [guid, msg] of this.subscriptions) {
        this.subscribe(msg);
        console.log(`[WS]: resubscribe to ${msg.opcode}`)
      }
    }
  }

  subscribe(msg: BaseRequest) {
    if (this.subscriptions.has(msg.guid)) {
      return;
    }
    this.subscriptions.set(msg.guid, msg);
    this.sendMessage(msg);
  }

  unsubscribe(guid: string) {
    const msg : BaseRequest = {
      guid: guid,
      token: this.token.getValue() ?? '',
      opcode: "unsubscribe",
      format: '',
      exchange: ''
    }
    this.socket$?.next(msg);
    this.subscriptions.delete(guid);
  }

  sendMessage(msg: BaseRequest) {
    this.socket$?.next(msg);
  }

  close() {
    this.token.unsubscribe();
    this.socket$?.complete();
    this.connectedSub.unsubscribe();
  }

  private reconnect(): void {
    this.reconnection$ = interval(this.options.reconnectTimeout)
        .pipe(
          takeWhile((v, index) => index < this.options.reconnectAttempts && !this.socket$),
          tap(attempt => console.log('[WS] Reconnection attempt #' + attempt))
        );

    this.reconnection$.subscribe({
        next: () => {
          this.connect()
        },
        error: (e) => null,
        complete: () => {
            this.reconnection$ = null;

            if (!this.socket$) {
              this.close();
            }
        }});
    }


  private isBaseResponse(msg: WsMessage): msg is BaseResponse<unknown> {
    return (msg as BaseResponse<unknown>).data !== undefined;
  }
}
