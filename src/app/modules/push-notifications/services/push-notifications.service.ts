import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Observable, of, shareReplay, switchMap, take, throwError } from "rxjs";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { AuthService } from "../../../shared/services/auth.service";
import { catchHttpError, mapWith } from "../../../shared/utils/observable-helper";
import { catchError, filter, map } from "rxjs/operators";
import { PriceChangeRequest } from "../../notifications/models/firebase-notifications.model";
import { Store } from "@ngrx/store";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { selectPortfoliosState } from "../../../store/portfolios/portfolios.selectors";
import { EntityStatus } from "../../../shared/models/enums/entity-status";
import { PortfolioExtended } from "../../../shared/models/user/portfolio-extended.model";

interface ServerResponse {
  message: string;
}

interface RequiredReqData {
  device: string;
  token: string;
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

  private token$?: Observable<RequiredReqData | null>;

  constructor(
    private readonly http: HttpClient,
    private readonly angularFireMessaging: AngularFireMessaging,
    private readonly authService: AuthService,
    private readonly store: Store,
    private readonly errorHandlerService: ErrorHandlerService,
  ) { }

  subscribeToOrderExecute(): Observable<ServerResponse | null> {
    return this.getToken()
      .pipe(
        mapWith(
          () => this.store.select(selectPortfoliosState).pipe(
            filter(p => p.status === EntityStatus.Success),
            map(portfoliosState => Object.values(portfoliosState.entities) as PortfolioExtended[]),
          ),
          (requiredData, portfolios) => ({requiredData, portfolios})
        ),
        take(1),
        switchMap(({ requiredData, portfolios }) => this.http.post<ServerResponse>(
          this.baseUrl + '/actions/addOrdersExecute',
          {
            portfolios: portfolios.map(p => ({portfolio: p.portfolio, exchange: p.exchange})),
            device: requiredData!.device
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
        switchMap(requiredData => this.http.post<ServerResponse>(this.baseUrl + '/actions/addPriceSpark', {
          ...body,
          ...requiredData
        })),
        catchHttpError<ServerResponse | null>(null, this.errorHandlerService),
      );
  }

  getMessages(): Observable<MessagePayload> {
    return this.angularFireMessaging.messages as any;
  }

  private getToken(): Observable<RequiredReqData | null> {
    if (this.token$) {
      return this.token$;
    }

    this.token$ = this.authService.currentUser$.pipe(
      mapWith(
        () => this.angularFireMessaging.requestToken,
        (user, token) => ({ device: user.refreshToken, token } as RequiredReqData)
      ),
      filter(({ device, token }) => !!token && !!device),
      mapWith(
        (requiredData: RequiredReqData) => this.http.post<ServerResponse>(this.baseUrl + '/actions/addToken', requiredData)
          .pipe(
            catchHttpError<ServerResponse | null>(null, this.errorHandlerService)
          ),
        (requiredData, res) => res ? requiredData : null),
      filter(data => !!data),
      shareReplay(1)
    );

    return this.token$;
  }
}
