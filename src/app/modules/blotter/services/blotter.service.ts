import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  combineLatest,
  merge,
  Observable,
  of
} from 'rxjs';
import {
  map,
  startWith
} from 'rxjs/operators';
import {
  CurrencyCode,
  CurrencyInstrument
} from 'src/app/shared/models/enums/currencies.model';
import { Exchanges } from 'src/app/shared/models/enums/exchanges';
import { Order } from 'src/app/shared/models/orders/order.model';
import {
  StopOrder,
  StopOrderData
} from 'src/app/shared/models/orders/stop-order.model';
import { Position } from 'src/app/shared/models/positions/position.model';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { Trade } from 'src/app/shared/models/trades/trade.model';
import { BaseWebsocketService } from 'src/app/shared/services/base-websocket.service';
import { OrdersNotificationsService } from 'src/app/shared/services/orders-notifications.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { formatCurrency } from 'src/app/shared/utils/formatters';
import { CommonSummaryView } from '../models/common-summary-view.model';
import { CommonSummaryModel } from '../models/common-summary.model';
import { ForwardRisks } from "../models/forward-risks.model";
import { ForwardRisksView } from "../models/forward-risks-view.model";
import { selectNewInstrumentByBadge } from "../../../store/instruments/instruments.actions";

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

  selectNewInstrument(symbol: string, exchange: string, badgeColor: string) {
    if (symbol == CurrencyCode.RUB) {
      return;
    }
    if (CurrencyCode.isCurrency(symbol)) {
      symbol = CurrencyCode.toInstrument(symbol);
      exchange = Exchanges.MOEX;
    }
    const instrument = { symbol, exchange, instrumentGroup: undefined };
    this.store.dispatch(selectNewInstrumentByBadge({ instrument, badgeColor }));
  }

  getPositions(settings: BlotterSettings) {
    return this.getPositionsReq(settings.portfolio, settings.exchange, settings.guid).pipe(
      map(poses => settings.isSoldPositionsHidden ? poses.filter(p => p.qtyTFuture !== 0) : poses),
    );
  }

  getTrades(settings: BlotterSettings) {
    return this.getTradesReq(settings.portfolio, settings.exchange, settings.guid);
  }

  getOrders(settings: BlotterSettings) {
    return this.getOrdersReq(settings.portfolio, settings.exchange, settings.guid);
  }

  getStopOrders(settings: BlotterSettings) {
    return this.getStopOrdersReq(settings.portfolio, settings.exchange, settings.guid);
  }

  getCommonSummary(settings: BlotterSettings): Observable<CommonSummaryView> {
    if (settings.currency != CurrencyInstrument.RUB) {
      return combineLatest([
        this.getCommonSummaryReq(settings.portfolio, settings.exchange, settings.guid),
        this.quotes.getQuotes(settings.currency, 'MOEX')
      ]).pipe(
        map(([summary, quote]) => this.formatCommonSummary(summary, settings.currency, quote.last_price))
      );
    } else {
      return this.getCommonSummaryReq(settings.portfolio, settings.exchange, settings.guid).pipe(
        map(summary => this.formatCommonSummary(summary, CurrencyInstrument.RUB, 1))
      );
    }
  }

  getForwardRisks(settings: BlotterSettings): Observable<ForwardRisksView> {
    if (settings.currency != CurrencyInstrument.RUB) {
      return combineLatest([
        this.getForwardRisksReq(settings.portfolio, settings.exchange, settings.guid),
        this.quotes.getQuotes(settings.currency, 'MOEX')
      ]).pipe(
        map(([risks, quote]) => this.formatForwardRisks(risks, settings.currency, quote.last_price))
      );
    } else {
      return this.getForwardRisksReq(settings.portfolio, settings.exchange, settings.guid).pipe(
        map(risks => this.formatForwardRisks(risks, CurrencyInstrument.RUB, 1))
      );
    }
  }

  private formatCommonSummary(summary: CommonSummaryModel, currency: string, exchangeRate: number): CommonSummaryView {
    return ({
      buyingPowerAtMorning: formatCurrency(summary.buyingPowerAtMorning / exchangeRate, currency),
      buyingPower: formatCurrency(summary.buyingPower / exchangeRate, currency),
      profit: formatCurrency(summary.profit / exchangeRate, currency),
      profitRate: summary.profitRate,
      portfolioEvaluation: formatCurrency(summary.portfolioEvaluation / exchangeRate, currency),
      portfolioLiquidationValue: formatCurrency(summary.portfolioLiquidationValue / exchangeRate, currency),
      initialMargin: formatCurrency(summary.initialMargin / exchangeRate, currency),
      riskBeforeForcePositionClosing: formatCurrency(summary.riskBeforeForcePositionClosing / exchangeRate, currency),
      commission: formatCurrency(summary.commission / exchangeRate, currency),
    });
  }

  private formatForwardRisks(risks: ForwardRisks, currency: string, exchangeRate: number): ForwardRisksView {
    return {
      moneyFree: formatCurrency(risks.moneyFree / exchangeRate, currency),
      moneyBlocked: formatCurrency(risks.moneyBlocked / exchangeRate, currency),
      fee: formatCurrency(risks.fee / exchangeRate, currency),
      moneyOld: formatCurrency(risks.moneyOld / exchangeRate, currency),
      moneyAmount: formatCurrency(risks.moneyAmount / exchangeRate, currency),
      moneyPledgeAmount: formatCurrency(risks.moneyPledgeAmount / exchangeRate, currency),
      vmInterCl: formatCurrency(risks.vmInterCl / exchangeRate, currency),
      vmCurrentPositions: formatCurrency(risks.vmCurrentPositions / exchangeRate, currency),
      varMargin: formatCurrency(risks.varMargin / exchangeRate, currency),
      isLimitsSet: risks.isLimitsSet
    } as ForwardRisksView;
  }

  private getCommonSummaryReq(portfolio: string, exchange: string, trackId: string) {
    return this.getPortfolioEntity<CommonSummaryModel>(
      portfolio,
      exchange,
      "SummariesGetAndSubscribeV2",
      trackId
    );
  }

  private getForwardRisksReq(portfolio: string, exchange: string, trackId: string) {
    return this.getPortfolioEntity<ForwardRisks>(
      portfolio,
      exchange,
      "SpectraRisksGetAndSubscribe",
      trackId
    );
  }

  private getPositionsReq(portfolio: string, exchange: string, trackId: string) {
    this.positions = new Map<string, Position>();
    const positions = this.getPortfolioEntity<Position>(
      portfolio,
      exchange,
      'PositionsGetAndSubscribeV2',
      trackId
    ).pipe(
      map((position: Position) => {
        if (!this.isEmptyPosition(position) || !!this.positions.get(position.symbol)) {
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

  private getStopOrdersReq(portfolio: string, exchange: string, trackId: string): Observable<StopOrder[]> {
    this.stopOrders = new Map<string, StopOrder>();
    const stopOrders = this.getPortfolioEntity<StopOrderData>(
      portfolio,
      exchange,
      'StopOrdersGetAndSubscribeV2',
      trackId
    ).pipe(
      map((order: StopOrderData) => {
        const existingOrder = this.stopOrders.get(order.id);
        order.transTime = new Date(order.transTime);
        order.endTime = new Date(order.endTime);

        if (existingOrder) {
          this.notification.notificateOrderChange(order, existingOrder);
        } else {
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

  private getOrdersReq(portfolio: string, exchange: string, trackId: string) {
    this.orders = new Map<string, Order>();
    const orders = this.getPortfolioEntity<Order>(
      portfolio,
      exchange,
      'OrdersGetAndSubscribeV2',
      trackId
    ).pipe(
      map((order: Order) => {
        const existingOrder = this.orders.get(order.id);
        order.transTime = new Date(order.transTime);
        order.endTime = new Date(order.endTime);

        if (existingOrder) {
          this.notification.notificateOrderChange(order, existingOrder);
        } else {
          this.notification.notificateAboutNewOrder(order);
        }
        this.orders.set(order.id, order);
        return Array.from(this.orders.values()).sort((o1, o2) => o2.id.localeCompare(o1.id));
      })
    );

    return orders.pipe(startWith([]));
  }

  private getTradesReq(portfolio: string, exchange: string, trackId: string): Observable<Trade[]> {
    this.trades = new Map<string, Trade>();

    const trades = this.getPortfolioEntity<Trade>(
      portfolio,
      exchange,
      'TradesGetAndSubscribeV2',
      trackId).pipe(
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
