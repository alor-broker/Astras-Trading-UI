import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse
} from "@angular/common/http";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { Store } from "@ngrx/store";
import { NzNotificationService } from "ng-zorro-antd/notification";
import {
  Observable,
  of,
  switchMap,
  take,
  tap
} from "rxjs";
import {
  LimitOrder,
  MarketOrder,
  StopLimitOrder,
  StopMarketOrder,
  SubmitOrderResponse,
  SubmitOrderResult
} from "../../modules/command/models/order.model";
import { GuidGenerator } from "../utils/guid";
import { httpLinkRegexp } from "../utils/regexps";
import { getSelectedPortfolio } from "../../store/portfolios/portfolios.selectors";
import {
  catchError,
  filter,
  map
} from "rxjs/operators";
import { PortfolioKey } from "../models/portfolio-key.model";
import { environment } from "../../../environments/environment";
import { toUnixTimestampSeconds } from "../utils/datetime";

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly baseApiUrl = environment.apiUrl + '/commandapi/warptrans/TRADE/v2/client/orders/actions';

  constructor(private readonly httpService: HttpClient,
              private readonly notificationService: NzNotificationService,
              private readonly errorHandlerService: ErrorHandlerService,
              private readonly store: Store) {
  }

  submitMarketOrder(order: MarketOrder): Observable<SubmitOrderResult> {
    return this.submitOrder(() => ({
      url: `${this.baseApiUrl}/market`,
      body: {
        ...order
      }
    }));
  }

  submitLimitOrder(order: LimitOrder): Observable<SubmitOrderResult> {
    return this.submitOrder(() => ({
      url: `${this.baseApiUrl}/limit`,
      body: {
        ...order
      }
    }));
  }

  submitStopMarketOrder(order: StopMarketOrder): Observable<SubmitOrderResult> {
    return this.submitOrder(() => ({
      url: `${this.baseApiUrl}/stop`,
      body: {
        ...order,
        stopEndUnixTime: this.prepareStopEndUnixTimeValue(order)
      }
    }));
  }

  submitStopLimitOrder(order: StopLimitOrder): Observable<SubmitOrderResult> {
    return this.submitOrder(() => ({
      url: `${this.baseApiUrl}/stopLimit`,
      body: {
        ...order,
        stopEndUnixTime: this.prepareStopEndUnixTimeValue(order)
      }
    }));
  }

  private prepareStopEndUnixTimeValue(order: StopMarketOrder): number | null {
    if (!order.stopEndUnixTime) {
      return 0;
    }

    if (typeof order.stopEndUnixTime === 'number') {
      return Number((order.stopEndUnixTime / 1000).toFixed(0));
    } else {
      return toUnixTimestampSeconds(order.stopEndUnixTime);
    }
  }

  private submitOrder(prepareOrderRequest: () => { url: string, body: any }): Observable<SubmitOrderResult> {
    return this.store.select(getSelectedPortfolio)
      .pipe(
        filter((x): x is PortfolioKey => !!x),
        take(1),
        switchMap(portfolio => {
          const orderRequest = prepareOrderRequest();

          return this.httpService.post<SubmitOrderResponse>(
            orderRequest.url,
            {
              ...orderRequest.body,
              user: {
                portfolio: portfolio.portfolio
              }
            },
            {
              headers: {
                'X-ALOR-REQID': GuidGenerator.newGuid(),
                'X-ALOR-ORIGINATOR': 'astras'
              }
            }
          );
        }),
        catchError(err => {
          if (!(err instanceof HttpErrorResponse)) {
            this.errorHandlerService.handleError(err);
            return of(null);
          }

          this.handleCommandError(err);
          return of(null);
        }),
        map(response => ({
          isSuccess: !!response?.orderNumber,
          orderNumber: response?.orderNumber
        } as SubmitOrderResult)),
        tap(result => {
          if (result.isSuccess) {
            this.notificationService.success(
              `Заявка выставлена`,
              `Заявка успешно выставлена, её номер на бирже: \n ${result.orderNumber}`
            );
          }
        })
      );
  }

  private handleCommandError(error: HttpErrorResponse) {
    const errorTitle = 'Заявка не выставлена';
    const errorMessage = !!error.error.code && !!error.error.message
      ? `Ошибка ${error.error.code} <br/> ${error.error.message}`
      : error.message;
    this.notificationService.error(errorTitle, this.prepareErrorMessage(errorMessage));
  }

  private prepareErrorMessage(message: string): string {
    const links = new RegExp(httpLinkRegexp, 'im').exec(message);
    if (!links?.length) {
      return message;
    }

    return links!.reduce((result, link) => result.replace(link, `<a href="${link}" target="_blank">${link}</a>`), message);
  }
}
