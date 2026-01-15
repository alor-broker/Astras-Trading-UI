import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {
  forkJoin,
  from,
  fromEvent,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  tap,
  throwError,
} from "rxjs";
import {
  catchHttpError,
  mapWith
} from "../../../shared/utils/observable-helper";
import {
  catchError,
  filter,
  map
} from "rxjs/operators";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import {
  OrderExecuteSubscription,
  PriceChangeRequest,
  PushSubscriptionType,
  SubscriptionBase
} from "../models/push-notifications.model";
import { BaseCommandResponse } from "../../../shared/models/http-request-response.model";
import { isPortfoliosEqual } from "../../../shared/utils/portfolios";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { TranslatorService } from "../../../shared/services/translator.service";
import { environment } from "../../../../environments/environment";
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import { LoggerService } from "../../../shared/services/logging/logger.service";
import { DeviceHelper } from "../../../shared/utils/device-helper";
import isSupported = firebase.messaging.isSupported;

export type MessagingStatus = NotificationPermission | 'not-supported';

interface MessagePayload extends firebase.messaging.MessagePayload {
  data?: {
    body?: string;
  };
  messageId: string;
}

interface MessagingState {
  permission: MessagingStatus;
  swToken: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService implements OnDestroy {
  private readonly environmentService = inject(EnvironmentService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly translatorService = inject(TranslatorService);
  private readonly loggerService = inject(LoggerService);

  private readonly messaging = firebase.messaging(firebase.initializeApp(environment.firebase));

  private readonly baseUrl = this.environmentService.apiUrl + '/commandapi/observatory/subscriptions';

  private token$?: Observable<string | null>;

  private readonly subscriptionsUpdatedSub = new Subject<PushSubscriptionType | null>();

  readonly subscriptionsUpdated$ = this.subscriptionsUpdatedSub.asObservable();

  private messages$?: Observable<MessagePayload>;

  private messagingState$: Observable<MessagingState> | null = null;

  subscribeToOrdersExecute(portfolios: {
    portfolio: string;
    exchange: string;
  }[]): Observable<BaseCommandResponse | null> {
    return this.cancelOrderExecuteSubscriptions(portfolios)
      .pipe(
        switchMap(isNeedResubscribe => {
          if (!isNeedResubscribe) {
            return of({message: 'success'});
          }

          return this.httpClient.post<BaseCommandResponse | null>(this.baseUrl + '/actions/addOrdersExecute', {
            portfolios: portfolios.map(p => ({portfolio: p.portfolio, exchange: p.exchange}))
          });
        }),
        catchError(err => {
          if (err.error?.code === 'SubscriptionAlreadyExists') {
            return of({message: 'success', code: err.error.code as string});
          }
          return throwError(err);
        }),
        catchHttpError<BaseCommandResponse | null>(null, this.errorHandlerService),
        tap(r => {
          if (!!r) {
            this.subscriptionsUpdatedSub.next(PushSubscriptionType.OrderExecute);
          }
        })
      );
  }

  subscribeToPriceChange(request: PriceChangeRequest): Observable<BaseCommandResponse | null> {
    return this.initFCM()
      .pipe(
        take(1),
        switchMap(() => this.httpClient.post<BaseCommandResponse>(this.baseUrl + '/actions/addPriceSpark', request)),
        catchError(err => {
          if (err.error?.code === 'SubscriptionAlreadyExists') {
            return of({message: 'success', code: err.error.code as string});
          }
          return throwError(err);
        }),
        catchHttpError<BaseCommandResponse | null>(null, this.errorHandlerService),
        take(1),
        tap(r => {
          if (!!r) {
            this.subscriptionsUpdatedSub.next(PushSubscriptionType.PriceSpark);
          }
        })
      );
  }

  getMessages(): Observable<MessagePayload> {
    this.messages$ ??= this.initFCM().pipe(
      switchMap(() => {
          return new Observable<MessagePayload>(subscriber => {
            this.messaging.onMessage(value => subscriber.next(value));
          });
        }
      ),
      shareReplay(1)
    );

    return this.messages$;
  }

  getCurrentSubscriptions(): Observable<SubscriptionBase[] | null> {
    return this.initFCM().pipe(
      filter(x => x != null && x.length > 0),
      switchMap(() => this.httpClient.get<SubscriptionBase[]>(this.baseUrl)),
      catchHttpError<SubscriptionBase[] | null>(null, this.errorHandlerService),
      map(s => {
        if (!s) {
          return s;
        }

        return s.map(x => ({
          ...x,
          createdAt: new Date(x.createdAt)
        }));
      }),
      take(1)
    );
  }

  cancelSubscription(id: string): Observable<BaseCommandResponse | null> {
    return this.initFCM()
      .pipe(
        switchMap(() => this.httpClient.delete<BaseCommandResponse>(`${this.baseUrl}/${id}`)),
        catchHttpError<BaseCommandResponse | null>(null, this.errorHandlerService),
        take(1),
        tap(r => {
          if (!!r) {
            this.subscriptionsUpdatedSub.next(null);
          }
        })
      );
  }

  getBrowserNotificationsStatus(): Observable<MessagingStatus> {
    return this.getMessagingState().pipe(
      map(s => s.permission)
    );
  }

  ngOnDestroy(): void {
    this.subscriptionsUpdatedSub.complete();
  }

  private getMessagingState(): Observable<MessagingState> {
    if (this.messagingState$ == null) {
      if (window.Notification == null || !isSupported()) {
        this.messagingState$ = of({
          permission: 'not-supported' as MessagingStatus,
          swToken: null
        }).pipe(
          shareReplay(1)
        );

        this.loggerService.info(this.formatLogMessage('Push is not supported'));
      } else {
        let base = of(null);

        if (DeviceHelper.isSafari()) {
          base = fromEvent(document, 'click').pipe(
            map(() => null)
          );
        }

        this.messagingState$ = base.pipe(
          take(1),
          switchMap(() => navigator.serviceWorker.ready),
          switchMap(() => Notification.requestPermission()),
          catchError(e => {
            this.loggerService.error(this.formatLogMessage(`Unable to request permission. Details: ${e}`));
            return of(null);
          }),
          switchMap(p => {
            this.loggerService.info(`Push permission: ${p ?? ''}`);

            if (p == null || p !== 'granted') {
              return of({
                permission: p ?? 'not-supported' as MessagingStatus,
                swToken: null
              });
            }

            return from(this.messaging.getToken()).pipe(
              catchError(e => {
                this.loggerService.warn(this.formatLogMessage(`Unable to get FCM token. Details: ${e}`));
                return of(null);
              }),
              map(t => {
                if (t != null && t.length > 0) {
                  return {
                    permission: p,
                    swToken: t
                  };
                }

                return {
                  permission: p,
                  swToken: null
                };
              })
            );
          }),
          take(1),
          shareReplay(1)
        );
      }
    }

    return this.messagingState$;
  }

  private initFCM(): Observable<string | null> {
    if (this.token$) {
      return this.token$;
    }

    this.token$ = this.getMessagingState().pipe(
      filter(state => state.swToken != null && state.swToken.length > 0),
      mapWith(
        state => this.httpClient.post<BaseCommandResponse>(
          this.baseUrl + '/actions/addToken',
          {
            token: state.swToken,
            culture: this.translatorService.getActiveLang()
          }
        )
          .pipe(
            catchError(err => {
              if (err.error?.code === 'TokenAlreadyExists') {
                return of({message: 'success', code: err.error.code as string});
              }
              return throwError(err);
            }),
            catchHttpError<BaseCommandResponse | null>(null, this.errorHandlerService)
          ),
        (state, res) => res ? state.swToken! : null),
      filter(token => token != null && !!token.length),
      shareReplay(1)
    );

    return this.token$;
  }

  private cancelOrderExecuteSubscriptions(portfolios: { portfolio: string, exchange: string }[]): Observable<boolean> {
    return this.initFCM()
      .pipe(
        switchMap(() => this.getCurrentSubscriptions()),
        map(subs => (subs ?? []).filter((s): s is OrderExecuteSubscription => s.subscriptionType === PushSubscriptionType.OrderExecute)),
        switchMap((subs: OrderExecuteSubscription[]) => {
          const isNeedResubscribe = subs.length !== portfolios.length || subs.reduce((acc, curr) => {
            if (!acc) {
              return !portfolios.find(p => isPortfoliosEqual(p, curr));
            }

            return acc;
          }, false);

          if (!isNeedResubscribe) {
            return of(false);
          }

          const subsToDelete = subs
            .map(s => s.id)
            .map(id => this.cancelSubscription(id));

          return forkJoin(subsToDelete.length ? subsToDelete : [of(null)])
            .pipe(
              map(() => true)
            );
        })
      );
  }

  private formatLogMessage(message: string): string {
    return `[Push]: ${message}`;
  }
}
