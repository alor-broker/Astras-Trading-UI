import { Injectable } from '@angular/core';
import { Subject, EMPTY, Observable, timer, BehaviorSubject } from 'rxjs';
import { catchError, delayWhen, filter, map, retryWhen, switchAll, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from "rxjs/webSocket";
import { environment } from 'src/environments/environment';
import { BaseRequest } from '../models/ws/base-request.model';
import { BaseResponse } from '../models/ws/base-response.model';
import { ConfirmResponse } from '../models/ws/confirm-response.model';
import { WsOptions } from '../models/ws/ws-options.model';
import { AccountService } from './account.service';

const RECONNECT_INTERVAL = 2000;

type WsMessage = BaseResponse<unknown> | BaseRequest | ConfirmResponse;

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  config: WebSocketSubjectConfig<WsMessage>;
  token = new BehaviorSubject<string>('empty');

  constructor(private account: AccountService) {
    this.account.accessToken$.subscribe(this.token)
    this.config = {
      url: environment.wsUrl,
      serializer: msg => JSON.stringify({
        ...msg,
        token: this.token.getValue()
      }),
      deserializer: ({data}) => JSON.parse(data),
      openObserver: {
        next: () => {
          console.log('[DataService]: connection ok');
        }
      },
      closeObserver: {
        next: () => {
          console.log('[DataService]: connection closed');
          this.socket$ = webSocket(this.config);
          this.connect({ reconnect: true });
        }
      },
    }

  }
  // @ts-ignore: Property has no initializer and is not definitely assigned
  private socket$: WebSocketSubject<WsMessage>;
  private messagesSubject$ = new Subject<BaseResponse<unknown>>();
  messages$ = this.messagesSubject$.asObservable();

  connect(options: WsOptions): void {
    if (!this.socket$ || this.socket$.closed) {

      this.socket$ = webSocket(this.config);
      this.socket$.pipe(options.reconnect ? this.reconnect : o => o).subscribe(
        (message) => {
          if (this.isBaseResponse(message)) {
            this.messagesSubject$.next(message);
          }
        },
        (error: Event) => {
            if (!this.socket$) {
                // run reconnect if errors
                console.log(error);
            }
        });
    }
  }

  unsubscribe(guid: string) {
    const msg : BaseRequest = {
      guid: guid,
      token: this.token.getValue(),
      opcode: "unsubscribe",
      format: '',
      exchange: ''
    }
    this.socket$.next(msg);
  }

  sendMessage(msg: BaseRequest) {
    this.socket$.next(msg);
  }

  close() {
    this.token.unsubscribe();
    this.socket$.complete();
  }

  private reconnect(observable: Observable<any>): Observable<any> {
    return observable.pipe(
      retryWhen(errors => errors.pipe(
        tap(val => console.log('[WS] Try to reconnect', val)),
        delayWhen(_ => timer(RECONNECT_INTERVAL)))
      )
    );
  }

  private isBaseResponse(msg: WsMessage): msg is BaseResponse<unknown> {
    return (msg as BaseResponse<unknown>).data !== undefined;
  }
}
