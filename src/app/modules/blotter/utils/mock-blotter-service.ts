import { Observable, of } from "rxjs";
import { Position } from "src/app/shared/models/positions/position.model";
import { BlotterSettings } from "src/app/shared/models/settings/blotter-settings.model";
import { Trade } from "src/app/shared/models/trades/trade.model";
import { Order } from "../../../shared/models/orders/order.model";

export class MockServiceBlotter {
  settings$: Observable<BlotterSettings | null> = of({
    exchange: 'MOEX',
    portfolio: 'D39004'
  });
  order$: Observable<Order[]> = of([]);
  trade$: Observable<Trade[]> = of([]);
  position$: Observable<Position[]> = of([]);

  setSettings(settings: BlotterSettings): void {

  }
  unsubscribe(): void {

  }
  getTrades(portfolio: string, exchange: string): Observable<Trade[]> {
    return of([])
  }
  getPositions(portfolio: string, exchange: string): Observable<Position[]> {
    return of([])

  }
  getOrders(portfolio: string, exchange: string): Observable<Order[]> {
    return of([])
  }

}
