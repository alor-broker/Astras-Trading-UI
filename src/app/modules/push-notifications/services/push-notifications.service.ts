import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Observable, of, shareReplay, switchMap, take, throwError } from "rxjs";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { catchHttpError, mapWith } from "../../../shared/utils/observable-helper";
import { catchError, filter, map } from "rxjs/operators";
import { PriceChangeRequest } from "../models/firebase-notifications.model";
import { Store } from "@ngrx/store";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { selectPortfoliosState } from "../../../store/portfolios/portfolios.selectors";
import { EntityStatus } from "../../../shared/models/enums/entity-status";
import { PortfolioExtended } from "../../../shared/models/user/portfolio-extended.model";

interface ServerResponse {
  message: string;
}

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

  constructor(
    private readonly http: HttpClient,
    private readonly angularFireMessaging: AngularFireMessaging,
    private readonly store: Store,
    private readonly errorHandlerService: ErrorHandlerService,
  ) { }

  subscribeToOrderExecute(): Observable<ServerResponse | null> {
    return this.getToken()
      .pipe(
        switchMap(() => this.store.select(selectPortfoliosState)),
        filter(p => p.status === EntityStatus.Success),
        map(portfoliosState => Object.values(portfoliosState.entities) as PortfolioExtended[]),
        take(1),
        switchMap((portfolios) => this.http.post<ServerResponse>(
          this.baseUrl + '/actions/addOrdersExecute',
          {
            portfolios: portfolios.map(p => ({portfolio: p.portfolio, exchange: p.exchange})),
          })),
        catchError(err => {
          if (err.error.code === 'SubscriptionAlreadyExists') {
            return of(null);
          }
          return throwError(err);
        }),
        catchHttpError<ServerResponse | null>(null, this.errorHandlerService),
      );
  }

  subscribeToPriceChange(body: PriceChangeRequest): Observable<ServerResponse | null> {
    return this.getToken()
      .pipe(
        switchMap(() => this.http.post<ServerResponse>(this.baseUrl + '/actions/addPriceSpark', body)),
        catchHttpError<ServerResponse | null>(null, this.errorHandlerService),
      );
  }

  getMessages(): Observable<MessagePayload> {
    return this.angularFireMessaging.messages as any;
  }

  private getToken(): Observable<string | null> {
    if (this.token$) {
      return this.token$;
    }

    this.token$ = this.angularFireMessaging.requestToken
      .pipe(
        filter(token => !!token),
        mapWith(
          token => this.http.post<ServerResponse>(this.baseUrl + '/actions/addToken', { token })
            .pipe(
              catchError(err => {
                if (err.error.code === 'TokenAlreadyExists') {
                  return of({ message: 'success' });
                }
                return throwError(err);
              }),
              catchHttpError<ServerResponse | null>(null, this.errorHandlerService)
            ),
          (token, res) => res ? token : null),
        filter(token => !!token),
        shareReplay(1)
      );

    return this.token$;
  }
}
