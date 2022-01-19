import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Position } from 'src/app/shared/models/positions/position.model';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { BaseResponse } from 'src/app/shared/models/ws/base-response.model';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { Order } from '../models/order.model';
import { OrdersRequest } from '../models/orders-request.model';
import { Trade } from '../models/trade.model';

@Injectable({
  providedIn: 'root'
})
export class BlotterService {
  private tradesSubj = new BehaviorSubject<Trade[]>([]);
  private trades: Map<string, Trade> = new Map<string, Trade>();

  private positionsSubj = new BehaviorSubject<Position[]>([]);
  private positions: Map<string, Position> = new Map<string, Position>();

  private ordersSubj = new BehaviorSubject<Order[]>([]);
  private orders: Map<string, Order> = new Map<string, Order>();
  private subGuidByOpcode: Map<string, string> = new Map<string, string>();
  private settings: BehaviorSubject<BlotterSettings | null> = new BehaviorSubject<BlotterSettings | null>(null);

  settings$ = this.settings.asObservable()
  order$: Observable<Order[]> = this.ordersSubj.asObservable();
  trade$: Observable<Trade[]> = this.tradesSubj.asObservable();
  position$: Observable<Position[]> = this.positionsSubj.asObservable();

  constructor(private ws: WebsocketService) {  }

  setSettings(settings: BlotterSettings) {
    this.settings.next(settings);
  }

  setLinked(isLinked: boolean) {
    const current = this.getSettings();
    if (current) {
      this.settings.next({ ...current, linkToActive: isLinked })
    }
  }

  getSettings() {
    return this.settings.getValue();
  }

  unsubscribe() {
    this.subGuidByOpcode.forEach((_, guid) => this.ws.unsubscribe(guid));
  }

  getTrades(portfolio: string, exchange: string) {
    this.trades = new Map<string, Trade>();
    this.tradesSubj.next(Array.from(this.trades.values()))
    this.getEntity<Trade>(portfolio, exchange, 'TradesGetAndSubscribeV2', (trade: Trade) => {
      this.trades.set(trade.id, trade);
      this.tradesSubj.next(Array.from(this.trades.values()))
    })
    return this.trade$;
  }

  getPositions(portfolio: string, exchange: string) {
    this.positions = new Map<string, Position>();
    this.positionsSubj.next(Array.from(this.positions.values()))
    this.getEntity<Position>(portfolio, exchange, 'PositionsGetAndSubscribeV2', (position: Position) => {
      this.positions.set(position.symbol, position);
      this.positionsSubj.next(Array.from(this.positions.values()))
    })
    return this.position$;
  }

  getOrders(portfolio: string, exchange: string) {
    this.orders = new Map<string, Order>();
    this.ordersSubj.next(Array.from(this.orders.values()))
    this.getEntity<Order>(portfolio, exchange, 'OrdersGetAndSubscribeV2', (order: Order) => {
      this.orders.set(order.id, order);
      this.ordersSubj.next(Array.from(this.orders.values()))
    })
    return this.order$;
  }

  private getEntity<T>(portfolio: string, exchange: string, opcode: string, onUpdate: (entity: T) => void) {
    this.ws.connect()
    let guid = this.subGuidByOpcode.get(opcode);
    if (guid) {
      this.ws.unsubscribe(guid);
    }
    guid = GuidGenerator.newGuid();
    this.subGuidByOpcode.set(opcode, guid);
    const request : OrdersRequest = {
      opcode,
      portfolio,
      exchange,
      format:"simple",
      guid: guid,
    }
    this.ws.subscribe(request)

    this.ws.messages$.pipe(
      filter(m => m.guid == guid),
      map(r => {
        const br = r as BaseResponse<T>;
        return br.data;
      })
    ).subscribe(order => {
      onUpdate(order)
    })
  }
}
