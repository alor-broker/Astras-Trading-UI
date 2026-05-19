import {
  inject,
  Injectable,
  OnDestroy
} from '@angular/core';
import {
  catchError,
  forkJoin,
  map,
  NEVER,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  tap,
  throwError
} from 'rxjs';
import {BaseCommandResponse} from '@terminal-core-lib/common/types/http-request-response.types';
import {
  OrderExecuteSubscription,
  PriceChangeRequest,
  PushMessage,
  PushSubscriptionType,
  SubscriptionBase
} from '@terminal-core-lib/features/push-notifications/types/push-notifications.types';
import {PUSH_NOTIFICATIONS_CONNECTOR} from '@terminal-core-lib/features/push-notifications/types/push-notifications-connector.types';
import {filter} from 'rxjs/operators';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {HttpClient} from '@angular/common/http';
import {CORE_API_URL_PROVIDER} from '@terminal-core-lib/config/api-url-providers';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {PortfolioKeyEqualityComparer} from '@terminal-core-lib/common/utils/portfolio-key.helper';

export type MessagingStatus = NotificationPermission | 'not-supported';

@Injectable()
export class PushNotificationsService implements OnDestroy {
  readonly subscriptionsUpdated$ = NEVER;

  private messages$?: Observable<PushMessage>;

  private readonly pushNotificationsConnector = inject(PUSH_NOTIFICATIONS_CONNECTOR);

  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly translatorService = inject(TranslatorService);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly baseUrl = this.coreApiUrlProvider.apiUrl + '/commandapi/observatory/subscriptions';

  private token$?: Observable<string | null>;

  private readonly subscriptionsUpdatedSub = new Subject<PushSubscriptionType | null>();

  cancelSubscription(id: string): Observable<BaseCommandResponse | null> {
    return this.initFCM()
      .pipe(
        switchMap(() => this.httpClient.delete<BaseCommandResponse>(`${this.baseUrl}/${id}`)),
        catchHttpError<BaseCommandResponse | null>(null, this.errorHandlerService),
        take(1),
        tap(r => {
          if (r) {
            this.subscriptionsUpdatedSub.next(null);
          }
        })
      );
  }

  getMessages(): Observable<PushMessage> {
    this.messages$ ??= this.initFCM().pipe(
      switchMap(() => this.pushNotificationsConnector.getMessages()),
      shareReplay(1)
    );

    return this.messages$;
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
          if (r) {
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
          if (r) {
            this.subscriptionsUpdatedSub.next(PushSubscriptionType.PriceSpark);
          }
        })
      );
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

  getBrowserNotificationsStatus(): Observable<MessagingStatus> {
    return this.pushNotificationsConnector.getMessagingState().pipe(
      map(s => s.permission),
    );
  }

  ngOnDestroy(): void {
    this.subscriptionsUpdatedSub.complete();
  }

  private cancelOrderExecuteSubscriptions(portfolios: { portfolio: string, exchange: string }[]): Observable<boolean> {
    return this.initFCM()
      .pipe(
        switchMap(() => this.getCurrentSubscriptions()),
        map(subs => (subs ?? []).filter((s): s is OrderExecuteSubscription => s.subscriptionType === PushSubscriptionType.OrderExecute)),
        switchMap((subs: OrderExecuteSubscription[]) => {
          const isNeedResubscribe = subs.length !== portfolios.length || subs.reduce((acc, curr) => {
            if (!acc) {
              return !portfolios.find(p => PortfolioKeyEqualityComparer.equals(p, curr));
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

  private initFCM(): Observable<string | null> {
    if (this.token$) {
      return this.token$;
    }

    this.token$ = this.pushNotificationsConnector.getMessagingState().pipe(
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
}
