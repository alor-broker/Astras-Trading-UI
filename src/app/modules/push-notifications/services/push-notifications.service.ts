import {
  Injectable,
  OnDestroy
} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {
  combineLatest,
  forkJoin,
  from,
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

interface MessagePayload extends firebase.messaging.MessagePayload {
  data?: {
    body?: string;
  };
  messageId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService implements OnDestroy {
  private readonly messaging = firebase.messaging(firebase.initializeApp(environment.firebase));

  private readonly baseUrl = this.environmentService.apiUrl + '/commandapi/observatory/subscriptions';

  private token$?: Observable<string | null>;

  private readonly subscriptionsUpdatedSub = new Subject<PushSubscriptionType | null>();
  readonly subscriptionsUpdated$ = this.subscriptionsUpdatedSub.asObservable();

  private messages$?: Observable<MessagePayload>;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly translatorService: TranslatorService,
    private readonly loggerService: LoggerService
  ) {
  }

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
    return this.getToken()
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
    if (!this.messages$) {
      this.messages$ = this.getToken().pipe(
        switchMap(() => {
            return new Observable<MessagePayload>(subscriber => {
              this.messaging.onMessage(value => subscriber.next(value));
            });
          }
        ),
        shareReplay(1)
      );
    }

    return this.messages$;
  }

  getCurrentSubscriptions(): Observable<SubscriptionBase[] | null> {
    return this.getToken().pipe(
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
    return this.getToken()
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

  getBrowserNotificationsStatus(): Observable<NotificationPermission> {
    return from(Notification.requestPermission());
  }

  ngOnDestroy(): void {
    this.subscriptionsUpdatedSub.complete();
  }

  private getToken(): Observable<string | null> {
    if (this.token$) {
      return this.token$;
    }

    this.token$ = combineLatest({
      swReady: navigator.serviceWorker.ready,
      notificationsStatus: this.getBrowserNotificationsStatus()
    }).pipe(
      filter(x => x.swReady != null && x.notificationsStatus === 'granted'),
      take(1),
      switchMap(() => from(this.messaging.getToken())),
      filter(token => {
        const isValid = token != null && token.length > 0;
        if(!isValid) {
          this.loggerService.warn('Unable to get FCM token');
        }

        return isValid;
      }),
      mapWith(
        token => this.httpClient.post<BaseCommandResponse>(
          this.baseUrl + '/actions/addToken',
          {
            token,
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
        (token, res) => res ? token : null),
      filter(token => token != null && !!token.length),
      shareReplay(1)
    );

    return this.token$;
  }

  private cancelOrderExecuteSubscriptions(portfolios: { portfolio: string, exchange: string }[]): Observable<boolean> {
    return this.getToken()
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
}
