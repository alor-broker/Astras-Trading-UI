import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, merge, Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CurrencyCode, CurrencyInstrument } from 'src/app/shared/models/enums/currencies.model';
import { Exchanges } from 'src/app/shared/models/enums/exchanges';
import { Order } from 'src/app/shared/models/orders/order.model';
import { StopOrder, StopOrderData } from 'src/app/shared/models/orders/stop-order.model';
import { Position } from 'src/app/shared/models/positions/position.model';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { Trade } from 'src/app/shared/models/trades/trade.model';
import { BaseWebsocketService } from 'src/app/shared/services/base-websocket.service';
import { OrdersNotificationsService } from 'src/app/shared/services/orders-notifications.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { formatCurrency } from 'src/app/shared/utils/formatters';
import { SummaryView } from '../models/summary-view.model';
import { Summary } from '../models/summary.model';
import { selectNewInstrument } from '../../../store/instruments/instruments.actions';
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";

@Injectable({
  providedIn: 'root'
})
export class BlotterService extends BaseWebsocketService {
  private trades: Map<string, Trade> = new Map<string, Trade>();
  private positions: Map<string, Position> = new Map<string, Position>();
  private orders: Map<string, Order> = new Map<string, Order>();
  private stopOrders: Map<string, StopOrder> = new Map<string, StopOrder>();

  constructor(
    ws: WebsocketService,
    private readonly notification: OrdersNotificationsService,
    private readonly store: Store,
    private readonly quotes: QuotesService) {
    super(ws);
  }

  selectNewInstrument(symbol: string, exchange: string) {
    if (symbol == CurrencyCode.RUB) {
      return;
    }
    if (CurrencyCode.isCurrency(symbol)) {
      symbol = CurrencyCode.toInstrument(symbol);
      exchange = Exchanges.MOEX;
    }
    const instrument = { symbol, exchange, instrumentGroup: undefined};
    this.store.dispatch(selectNewInstrument({ instrument }));
  }

  getPositions(settings: BlotterSettings) {
    return this.getPositionsReq(settings.portfolio, settings.exchange).pipe(
      map(poses => settings.isSoldPositionsHidden ? poses.filter(p => p.qtyTFuture !== 0) : poses)
    );
  }

  getTrades(portfolioKey: PortfolioKey) {
    return this.getTradesReq(portfolioKey.portfolio, portfolioKey.exchange);
  }

  getOrders(portfolioKey: PortfolioKey) {
    return this.getOrdersReq(portfolioKey.portfolio, portfolioKey.exchange);
  }

  getStopOrders(portfolioKey: PortfolioKey) {
    return  this.getStopOrdersReq(portfolioKey.portfolio, portfolioKey.exchange);
  }

  getSummaries(settings: BlotterSettings) : Observable<SummaryView> {
    if (settings.currency != CurrencyInstrument.RUB) {
      return combineLatest([
        this.getSummariesReq(settings.portfolio, settings.exchange),
        this.quotes.getQuotes(settings.currency, 'MOEX')
      ]).pipe(
        map(([summary, quote]) => this.formatSummary(summary, settings.currency, quote.last_price))
      );
    }
    else {
      return this.getSummariesReq(settings.portfolio, settings.exchange).pipe(
        map(summary => this.formatSummary(summary, CurrencyInstrument.RUB, 1))
      );
    }
  }

  private formatSummary(summary: Summary, currency: string, exchangeRate: number) : SummaryView {
    return ({
      buyingPowerAtMorning: formatCurrency(summary.buyingPowerAtMorning / exchangeRate, currency),
      buyingPower: formatCurrency(summary.buyingPower / exchangeRate, currency),
      profit: formatCurrency(summary.profit / exchangeRate, currency),
      profitRate: summary.profitRate,
      portfolioEvaluation: formatCurrency(summary.portfolioEvaluation / exchangeRate, currency),
      portfolioLiquidationValue: formatCurrency(summary.portfolioLiquidationValue / exchangeRate, currency ),
      initialMargin: formatCurrency(summary.initialMargin / exchangeRate, currency),
      riskBeforeForcePositionClosing: formatCurrency(summary.riskBeforeForcePositionClosing / exchangeRate, currency),
      commission: formatCurrency(summary.commission / exchangeRate, currency),
    });
  }

  private getSummariesReq(portfolio: string, exchange: string) {
    return  this.getPortfolioEntity<Summary>(portfolio, exchange, "SummariesGetAndSubscribeV2");
  }

  private getPositionsReq(portfolio: string, exchange: string) {
    this.positions = new Map<string, Position>();
    const positions = this.getPortfolioEntity<Position>(portfolio, exchange, 'PositionsGetAndSubscribeV2').pipe(
      map((position: Position) => {
        if (!this.isEmptyPosition(position)) {
          this.positions.set(position.symbol, position);
        }
        return Array.from(this.positions.values());
      }),
    );
    return merge(positions, of([]));
  }

  private isEmptyPosition(position: Position) {
    return position.qtyT0 === 0 && position.qtyT1 === 0 && position.qtyT2 === 0 && position.qtyTFuture === 0;
  }

  private getStopOrdersReq(portfolio: string, exchange: string) : Observable<StopOrder[]> {
    this.orders = new Map<string, StopOrder>();
    const opcode = 'StopOrdersGetAndSubscribeV2';
    const stopOrders = this.getPortfolioEntity<StopOrderData>(portfolio, exchange, opcode, true).pipe(
      map((order: StopOrderData) => {
        const existingOrder = this.orders.get(order.id);
        order.transTime = new Date(order.transTime);
        order.endTime = new Date(order.endTime);

        if (existingOrder) {
          this.notification.notificateOrderChange(order, existingOrder);
        }
        else {
          this.notification.notificateAboutNewOrder(order);
        }
        const stopOrder = {
          ...order,
          triggerPrice: order.stopPrice,
          conditionType: order.condition
        };
        this.stopOrders.set(order.id, stopOrder);
        return Array.from(this.stopOrders.values()).sort((o1, o2) => o2.id.localeCompare(o1.id));
      })
    );
    return stopOrders.pipe(startWith([]));
  }

  private getOrdersReq(portfolio: string, exchange: string) {
    this.orders = new Map<string, Order>();
    const opcode = 'OrdersGetAndSubscribeV2';
    const orders = this.getPortfolioEntity<Order>(portfolio, exchange, opcode, true).pipe(
      map((order: Order) => {
        const existingOrder = this.orders.get(order.id);
        order.transTime = new Date(order.transTime);
        order.endTime = new Date(order.endTime);

        if (existingOrder) {
          this.notification.notificateOrderChange(order, existingOrder);
        }
        else {
          this.notification.notificateAboutNewOrder(order);
        }
        this.orders.set(order.id, order);
        return Array.from(this.orders.values()).sort((o1, o2) => o2.id.localeCompare(o1.id));
      })
    );
    return orders.pipe(startWith([]));
  }

  private getTradesReq(portfolio: string, exchange: string) : Observable<Trade[]> {
    this.trades = new Map<string, Trade>();

    const trades = this.getPortfolioEntity<Trade>(portfolio, exchange, 'TradesGetAndSubscribeV2').pipe(
      map((trade: Trade) => {
        this.trades.set(trade.id, {
          ...trade,
          date: new Date(trade.date)
        });

        return Array.from(this.trades.values());
      })
    );

    return merge(trades, of([]));
  }
}
