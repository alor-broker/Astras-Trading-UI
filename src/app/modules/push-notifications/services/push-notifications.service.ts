import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {
  forkJoin,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  tap,
  throwError,
} from "rxjs";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { catchHttpError, mapWith } from "../../../shared/utils/observable-helper";
import { catchError, filter, map } from "rxjs/operators";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import {
  OrderExecuteSubscription,
  PriceChangeRequest,
  PushSubscriptionType,
  SubscriptionBase
} from "../models/push-notifications.model";
import { BaseCommandResponse } from "../../../shared/models/http-request-response.model";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { isPortfoliosEqual } from "../../../shared/utils/portfolios";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { TranslatorService } from "../../../shared/services/translator.service";

interface MessagePayload extends firebase.default.messaging.MessagePayload {
  data?: {
    body?: string;
  };
  messageId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService implements OnDestroy {

  private readonly baseUrl = this.environmentService.apiUrl + '/commandapi/observatory/subscriptions';

  private token$?: Observable<string | null>;

  private readonly subscriptionsUpdatedSub = new Subject<PushSubscriptionType | null>();
  readonly subscriptionsUpdated$ = this.subscriptionsUpdatedSub.asObservable();

  private messages$?: Observable<MessagePayload>;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient,
    private readonly angularFireMessaging: AngularFireMessaging,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly translatorService: TranslatorService
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

          return this.http.post<BaseCommandResponse | null>(this.baseUrl + '/actions/addOrdersExecute', {
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

  subscribeToOrderExecute(portfolio: PortfolioKey): Observable<BaseCommandResponse | null> {
    return this.getToken()
      .pipe(
        filter(t => t != null && t.length > 0),
        switchMap(() => this.http.post<BaseCommandResponse>(this.baseUrl + '/actions/addOrderExecute', {
          exchange: portfolio.exchange,
          portfolio: portfolio.portfolio
        })),
        catchError(err => {
          if (err.error?.code === 'SubscriptionAlreadyExists') {
            return of({message: 'success', code: err.error.code as string});
          }
          return throwError(err);
        }),
        catchHttpError<BaseCommandResponse | null>(null, this.errorHandlerService),
        take(1),
      );
  }

  subscribeToPriceChange(request: PriceChangeRequest): Observable<BaseCommandResponse | null> {
    return this.getToken()
      .pipe(
        take(1),
        switchMap(() => this.http.post<BaseCommandResponse>(this.baseUrl + '/actions/addPriceSpark', request)),
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
      this.messages$ = this.angularFireMessaging.messages
        .pipe(
          map(payload => payload as MessagePayload),
          shareReplay(1)
        );
    }

    return this.messages$;
  }

  getCurrentSubscriptions(): Observable<SubscriptionBase[] | null> {
    return this.getToken().pipe(
      filter(x => x != null && x.length > 0),
      switchMap(() => this.http.get<SubscriptionBase[]>(this.baseUrl)),
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
        switchMap(() => this.http.delete<BaseCommandResponse>(`${this.baseUrl}/${id}`)),
        catchHttpError<BaseCommandResponse | null>(null, this.errorHandlerService),
        take(1),
        tap(r => {
          if (!!r) {
            this.subscriptionsUpdatedSub.next(null);
          }
        })
      );
  }

  getBrowserNotificationsStatus(): Observable<"default" | "denied" | "granted"> {
    return this.angularFireMessaging.requestPermission;
  }

  ngOnDestroy(): void {
    this.subscriptionsUpdatedSub.complete();
  }

  private getToken(): Observable<string | null> {
    if (this.token$) {
      return this.token$;
    }

    this.token$ = this.angularFireMessaging.requestToken
      .pipe(
        filter(token => token != null && !!token.length),
        mapWith(
          token => this.http.post<BaseCommandResponse>(
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
