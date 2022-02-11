import { Injectable } from '@angular/core';
import { combineLatest, merge, Observable, of, pipe, Subscription } from 'rxjs';
import { distinct, filter, map, startWith, switchMap } from 'rxjs/operators';
import { Currency } from 'src/app/shared/models/enums/currencies.model';
import { Order } from 'src/app/shared/models/orders/order.model';
import { PortfolioKey } from 'src/app/shared/models/portfolio-key.model';
import { Position } from 'src/app/shared/models/positions/position.model';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { Trade } from 'src/app/shared/models/trades/trade.model';
import { BaseWebsocketService } from 'src/app/shared/services/base-websocket.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { formatCurrency } from 'src/app/shared/utils/formatters';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { SummaryView } from '../models/summary-view.model';
import { Summary } from '../models/summary.model';

@Injectable({
  providedIn: 'root'
})
export class BlotterService extends BaseWebsocketService<BlotterSettings> {
  private trades: Map<string, Trade> = new Map<string, Trade>();
  private positions: Map<string, Position> = new Map<string, Position>();
  private orders: Map<string, Order> = new Map<string, Order>();

  private portfolioSub?: Subscription;
  private subGuidByOpcode: Map<string, string> = new Map<string, string>();

  order$: Observable<Order[]> = of([]);
  trade$: Observable<Trade[]> = of([]);
  position$: Observable<Position[]> = of([]);
  summary$: Observable<SummaryView> = of();

  constructor(
    ws: WebsocketService,
    settingsService: DashboardService,
    private sync: SyncService,
    private quotes: QuotesService) {
    super(ws, settingsService);
  }

  setTabIndex(index: number) {
    const settings = this.getSettingsValue();
    if (settings) {
      this.setSettings( {...settings, activeTabIndex: index })
    }
  }

  getPositions(guid: string) {
    this.position$ = this.getSettings(guid).pipe(
      filter((s): s is BlotterSettings => !!s),
      switchMap((settings) => this.getPositionsReq(settings.portfolio, settings.exchange))
    )
    this.linkToPortfolio();
    return this.position$;
  }

  getTrades(guid: string) {
    this.trade$ = this.getSettings(guid).pipe(
      filter((s): s is BlotterSettings => !!s),
      switchMap((settings) => this.getTradesReq(settings.portfolio, settings.exchange))
    )
    this.linkToPortfolio();
    return this.trade$;
  }

  getOrders(guid: string) {
    this.order$ = this.getSettings(guid).pipe(
      filter((s): s is BlotterSettings => !!s),
      switchMap((settings) => this.getOrdersReq(settings.portfolio, settings.exchange))
    )
    this.linkToPortfolio();
    return this.order$;
  }

  getSummaries(guid: string) : Observable<SummaryView> {
    this.summary$ = this.getSettings(guid).pipe(
      filter((s): s is BlotterSettings => !!s),
      switchMap((settings) => {
        if (settings.currency != Currency.Rub) {
          return combineLatest([
            this.getSummariesReq(settings.portfolio, settings.exchange),
            this.quotes.getQuotes(settings.currency, 'MOEX')
          ]).pipe(
            map(([summary, quote]) => this.formatSummary(summary, settings.currency, quote.last_price))
          )
        }
        else {
          return this.getSummariesReq(settings.portfolio, settings.exchange).pipe(
            map(summary => this.formatSummary(summary, Currency.Rub, 1))
          );
        }
      })
    )
    this.linkToPortfolio();
    return this.summary$;
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
    })
  }

  private getSummariesReq(portfolio: string, exchange: string) {
    const summary$ = this.getPortfolioEntity<Summary>(portfolio, exchange, "SummariesGetAndSubscribeV2");
    return summary$;
  }

  private getPositionsReq(portfolio: string, exchange: string) {
    this.positions = new Map<string, Position>();
    const positions = this.getPortfolioEntity<Position>(portfolio, exchange, 'PositionsGetAndSubscribeV2').pipe(
      map((position: Position) => {
        this.positions.set(position.symbol, position);
        return Array.from(this.positions.values());
      }),
    )
    return merge(positions, of([]));
  }

  private getOrdersReq(portfolio: string, exchange: string) {
    this.orders = new Map<string, Order>();
    const orders = this.getPortfolioEntity<Order>(portfolio, exchange, 'OrdersGetAndSubscribeV2').pipe(
      map((order: Order) => {
        this.orders.set(order.id, order);
        return Array.from(this.orders.values()).sort((o1, o2) => o2.id.localeCompare(o1.id));
      })
    );
    return orders.pipe(startWith([]))
  }

  private getTradesReq(portfolio: string, exchange: string) : Observable<Trade[]> {
    this.trades = new Map<string, Trade>();

    const trades = this.getPortfolioEntity<Trade>(portfolio, exchange, 'TradesGetAndSubscribeV2').pipe(
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
          const current = this.getSettingsValue();
          if (current && current.linkToActive &&
              !(current.portfolio == p.portfolio &&
              current.exchange == p.exchange)) {
            this.setSettings({ ...current, ...p });
          }
        })
      ).subscribe();
    }
  }
}
