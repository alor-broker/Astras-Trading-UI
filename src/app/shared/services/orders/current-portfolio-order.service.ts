import { Injectable } from '@angular/core';
import { Store } from "@ngrx/store";
import {
  Observable,
  switchMap,
  take
} from "rxjs";
import { OrderService } from "./order.service";
import {
  filter,
  map
} from "rxjs/operators";
import {
  LimitOrder,
  LimitOrderEdit,
  MarketOrder,
  StopLimitOrder,
  StopMarketOrder,
  SubmitOrderResult
} from "../../../modules/command/models/order.model";
import { getSelectedPortfolioKey } from "../../../store/portfolios/portfolios.selectors";
import { PortfolioKey } from "../../models/portfolio-key.model";

@Injectable({
  providedIn: 'root'
})
export class CurrentPortfolioOrderService {

  constructor(
    private readonly store: Store,
    private readonly orderService: OrderService
  ) {
  }

  submitMarketOrder(order: MarketOrder): Observable<SubmitOrderResult> {
    return this.getCurrentPortfolio().pipe(
      switchMap(p => this.orderService.submitMarketOrder(order, p))
    );
  }

  submitLimitOrder(order: LimitOrder): Observable<SubmitOrderResult> {
    return this.getCurrentPortfolio().pipe(
      switchMap(p => this.orderService.submitLimitOrder(order, p))
    );
  }

  submitStopMarketOrder(order: StopMarketOrder): Observable<SubmitOrderResult> {
    return this.getCurrentPortfolio().pipe(
      switchMap(p => this.orderService.submitStopMarketOrder(order, p))
    );
  }

  submitStopLimitOrder(order: StopLimitOrder): Observable<SubmitOrderResult> {
    return this.getCurrentPortfolio().pipe(
      switchMap(p => this.orderService.submitStopLimitOrder(order, p))
    );
  }

  submitLimitOrderEdit(orderEdit: LimitOrderEdit): Observable<SubmitOrderResult> {
    return this.getCurrentPortfolio().pipe(
      switchMap(p => this.orderService.submitLimitOrderEdit(orderEdit, p))
    );
  }

  private getCurrentPortfolio(): Observable<string> {
    return this.store.select(getSelectedPortfolioKey)
      .pipe(
        take(1),
        filter((p): p is PortfolioKey => !!p),
        map(p => p.portfolio),
      );
  }
}
