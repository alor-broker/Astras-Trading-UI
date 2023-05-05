import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { forkJoin, Observable, of, shareReplay, Subject, switchMap, take, tap, throwError } from "rxjs";
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

interface MessagePayload {
  data?: {
    body?: string
  },
  messageId: string
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {

  private readonly baseUrl = environment.apiUrl + '/commandapi/observatory/subscriptions';

  private token$?: Observable<string | null>;

  private readonly subscriptionsUpdatedSub = new Subject<PushSubscriptionType | null>();
  readonly subscriptionsUpdated$ = this.subscriptionsUpdatedSub.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly angularFireMessaging: AngularFireMessaging,
    private readonly errorHandlerService: ErrorHandlerService,
  ) {
  }

  subscribeToOrdersExecute(portfolios: { portfolio: string, exchange: string }[]): Observable<BaseCommandResponse | null> {
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
            return of({message: 'success', code: err.error.code});
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
        filter(t => !!t),
        switchMap(() => this.http.post<BaseCommandResponse>(this.baseUrl + '/actions/addOrderExecute', {
          exchange: portfolio.exchange,
          portfolio: portfolio.portfolio
        })),
        catchError(err => {
          if (err.error?.code === 'SubscriptionAlreadyExists') {
            return of({message: 'success', code: err.error.code});
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
            return of({message: 'success', code: err.error.code});
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
    return this.angularFireMessaging.messages as any;
  }

  getCurrentSubscriptions(): Observable<SubscriptionBase[] | null> {
    return this.getToken().pipe(
      filter(x => !!x),
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

  private getToken(): Observable<string | null> {
    if (this.token$) {
      return this.token$;
    }

    this.token$ = this.angularFireMessaging.requestToken
      .pipe(
        filter(token => !!token),
        mapWith(
          token => this.http.post<BaseCommandResponse>(this.baseUrl + '/actions/addToken', {token})
            .pipe(
              catchError(err => {
                if (err.error?.code === 'TokenAlreadyExists') {
                  return of({message: 'success', code: err.error.code});
                }
                return throwError(err);
              }),
              catchHttpError<BaseCommandResponse | null>(null, this.errorHandlerService)
            ),
          (token, res) => res ? token : null),
        filter(token => !!token),
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
              return !portfolios.find(p => p.portfolio === curr.portfolio && p.exchange === curr.exchange);
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
