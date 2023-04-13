import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Observable, of, switchMap, take, tap, throwError } from "rxjs";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { AuthService } from "../../../shared/services/auth.service";
import { catchHttpError } from "../../../shared/utils/observable-helper";
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

@Injectable({
  providedIn: 'root'
})
export class FirebaseNotificationsService {

  private readonly baseUrl = environment.apiUrl + '/commandapi/observatory/subscriptions';

  token: string | null = null;
  device: string | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly angularFireMessaging: AngularFireMessaging,
    private readonly authService: AuthService,
    private readonly store: Store,
    private readonly errorHandlerService: ErrorHandlerService,
  ) { }

  init() {
    this.authService.currentUser$.pipe(
      tap(user => this.device = user.refreshToken),
      switchMap(() => this.angularFireMessaging.requestToken),
      filter((token) => !!token),
      tap(token => this.token = token),
      switchMap(() => this.addToken()),
      filter(v => !!v),
      switchMap(() => this.subscribeToOrderExecute())
    )
      .subscribe();
  }

  addToken(): Observable<ServerResponse | null> {
    return this.http.post<ServerResponse>(this.baseUrl + '/actions/addToken', {
      token: this.token,
      device: this.device
    })
      .pipe(
        catchHttpError<ServerResponse | null>(null, this.errorHandlerService),
      );
  }

  private subscribeToOrderExecute(): Observable<ServerResponse | null> {
    return this.store.select(selectPortfoliosState).pipe(
      filter(p => p.status === EntityStatus.Success),
      map(portfoliosState => Object.values(portfoliosState.entities) as PortfolioExtended[]),
      take(1),
      switchMap((portfolios: PortfolioExtended[]) => this.http.post<ServerResponse>(this.baseUrl + '/actions/addOrdersExecute', {
        portfolios: portfolios.map(p => ({ portfolio: p.portfolio, exchange: p.exchange })),
        device: this.device
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
    return this.http.post<ServerResponse>(this.baseUrl + '/actions/addPriceSpark', {
      ...body,
      device: this.device,
      token: this.token
    })
      .pipe(
        catchHttpError<ServerResponse | null>(null, this.errorHandlerService),
      );
  }
}
