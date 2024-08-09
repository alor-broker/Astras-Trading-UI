import { Observable, of } from "rxjs";
import { Position } from "src/app/shared/models/positions/position.model";
import { RepoTrade, Trade } from "src/app/shared/models/trades/trade.model";
import { Order, StopOrder } from "../../../shared/models/orders/order.model";

export class MockServiceBlotter {
  order$: Observable<Order[]> = of([]);
  trade$: Observable<Trade[]> = of([]);
  position$: Observable<Position[]> = of([]);

  unsubscribe(): void {
    return;
  }

  getTrades(): Observable<Trade[]> {
    return of([]);
  }

  getRepoTrades(): Observable<RepoTrade[]> {
    return of([]);
  }

  getPositions(): Observable<Position[]> {
    return of([]);
  }

  getOrders(): Observable<Order[]> {
    return of([]);
  }

  getStopOrders(): Observable<StopOrder[]> {
    return of([]);
  }
}
