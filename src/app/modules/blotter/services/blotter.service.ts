import { Injectable } from '@angular/core';
import { BehaviorSubject, merge, Observable, of, Subscription } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { PortfolioKey } from 'src/app/shared/models/portfolio-key.model';
import { Position } from 'src/app/shared/models/positions/position.model';
import { BlotterSettings, isEqual } from 'src/app/shared/models/settings/blotter-settings.model';
import { BaseResponse } from 'src/app/shared/models/ws/base-response.model';
import { SyncService } from 'src/app/shared/services/sync.service';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { Order } from '../models/order.model';
import { OrdersRequest } from '../models/orders-request.model';
import { Trade } from '../models/trade.model';

@Injectable({
  providedIn: 'root'
})
export class BlotterService {
  private trades: Map<string, Trade> = new Map<string, Trade>();
  private positions: Map<string, Position> = new Map<string, Position>();
  private orders: Map<string, Order> = new Map<string, Order>();

  private portfolioSub?: Subscription;
  private subGuidByOpcode: Map<string, string> = new Map<string, string>();
  private settings: BehaviorSubject<BlotterSettings | null> = new BehaviorSubject<BlotterSettings | null>(null);

  settings$ = this.settings.asObservable()
  order$: Observable<Order[]> = of([]);
  trade$: Observable<Trade[]> = of([]);
  position$: Observable<Position[]> = of([]);

  constructor(private ws: WebsocketService, private sync: SyncService) {  }

  setSettings(settings: BlotterSettings) {
    const current = this.settings.getValue();

    if (!current || !isEqual(current, settings)) {
      this.settings.next(settings);
    }
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

  getPositions() {
    this.position$ = this.settings$.pipe(
      filter((s): s is BlotterSettings => !!s),
      switchMap(s => this.getPositionsReq(s.portfolio, s.exchange))
    )
    this.linkToPortfolio();
    return this.position$;
  }

  getTrades() {
    this.trade$ = this.settings$.pipe(
      filter((s): s is BlotterSettings => !!s),
      switchMap(s => this.getTradesReq(s.portfolio, s.exchange))
    )
    this.linkToPortfolio();
    return this.trade$;
  }

  getOrders() {
    this.order$ = this.settings$.pipe(
      filter((s): s is BlotterSettings => !!s),
      switchMap(s => this.getOrdersReq(s.portfolio, s.exchange))
    )
    this.linkToPortfolio();
    return this.order$;
  }

  private getPositionsReq(portfolio: string, exchange: string) {
    this.positions = new Map<string, Position>();
    const positions = this.getEntity<Position>(portfolio, exchange, 'PositionsGetAndSubscribeV2').pipe(
      map((position: Position) => {
        this.positions.set(position.symbol, position);
        return Array.from(this.positions.values());
      }),
    )
    return merge(positions, of([]));
  }

  private getOrdersReq(portfolio: string, exchange: string) {
    this.orders = new Map<string, Order>();
    const orders = this.getEntity<Order>(portfolio, exchange, 'OrdersGetAndSubscribeV2').pipe(
      map((order: Order) => {
        this.orders.set(order.id, order);
        return Array.from(this.orders.values());
      })
    );
    return merge(orders, of([]));
  }

  private getTradesReq(portfolio: string, exchange: string) : Observable<Trade[]> {
    this.trades = new Map<string, Trade>();

    const trades = this.getEntity<Trade>(portfolio, exchange, 'TradesGetAndSubscribeV2').pipe(
      map((trade: Trade) => {
        this.trades.set(trade.id, trade);
        return Array.from(this.trades.values());
      })
    )
    return merge(trades, of([]));
  }

  private linkToPortfolio() {
    if (!this.portfolioSub) {
      this.portfolioSub = this.sync.selectedPortfolio$.pipe(
        filter((p): p is PortfolioKey => !!p),
        map((p) => {
          const current = this.settings.getValue();
          if (current && current.linkToActive &&
              !(current.portfolio == p.portfolio &&
              current.exchange == p.exchange)) {
            this.setSettings({ ...current, ...p });
          }
        })
      ).subscribe();
    }
  }

  private getEntity<T>(portfolio: string, exchange: string, opcode: string) {
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

    return this.ws.messages$.pipe(
      filter(m => m.guid == guid),
      map(r => {
        const br = r as BaseResponse<T>;
        return br.data;
      })
    )
  }
}
