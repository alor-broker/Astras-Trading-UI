import {
  BaseExtension,
  ChartContext
} from "./base.extension";
import {
  combineLatest,
  Observable,
  shareReplay,
  Subject,
  Subscription,
  switchMap,
  take,
  tap,
  TeardownLogic
} from "rxjs";
import {
  inject,
  Injectable
} from "@angular/core";
import {
  debounceTime,
  map
} from "rxjs/operators";
import {Trade} from '@terminal-core-lib/features/portfolios/types/trade.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {MarketService} from '@terminal-core-lib/features/market-config/market.service';
import {TradesHistoryService} from '@terminal-core-lib/features/client-info/services/trade-history.service';
import {MarketExchange} from '@terminal-core-lib/features/market-config/market-config.types';
import {TranslatorFn} from '@terminal-core-lib/features/translations/services/translator-service.types';
import {
  TechChartTradesDisplaySettings,
  TradeDisplayMarker
} from '@terminal-widgets-lib/widgets/tech-chart/widget-settings.types';
import {
  EntityId,
  IChartWidgetApi,
  TimezoneInfo
} from '@terminal-widgets-lib/assets/charting_library';
import {ThemeSettings} from '@terminal-core-lib/features/themes/themes.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';

interface IRemovableChartItem {
  remove(): void;
}

class TradesState {
  private readonly drawnTrades = new Map<string, IRemovableChartItem>();

  private readonly loadedData = new Map<string, Trade>();

  private oldestTrade: Trade | null = null;

  private readonly tearDown = new Subscription();

  constructor(public readonly instrument: InstrumentKey) {
    this.tearDown.add(() => this.clear());
  }

  addLoadedItem(item: Trade): void {
    this.loadedData.set(item.id, item);

    if (!this.oldestTrade || this.oldestTrade.date.getTime() > item.date.getTime()) {
      this.oldestTrade = item;
    }
  }

  isTradeDrawn(trade: Trade): boolean {
    return this.drawnTrades.has(trade.id);
  }

  markTradeDrawn(trade: Trade, removableItem: IRemovableChartItem): void {
    this.drawnTrades.set(trade.id, removableItem);
  }

  getOldestTrade(): Trade | null {
    return this.oldestTrade;
  }

  getTradesForRange(fromSec: number, toSec: number): Trade[] {
    return Array.from(this.loadedData.values())
      .filter(t => {
        const tradeTime = Math.round(t.date.getTime() / 1000);
        return tradeTime >= fromSec && tradeTime <= toSec;
      });
  }

  destroy(): void {
    this.tearDown.unsubscribe();
  }

  clear(): void {
    this.drawnTrades.forEach(t => {
      try {
        t.remove();
      } catch { /* empty */
      }
    });

    this.drawnTrades.clear();
    this.loadedData.clear();
    this.oldestTrade = null;
  }

  onDestroy(teardown: TeardownLogic): void {
    this.tearDown.add(teardown);
  }
}

@Injectable()
export class TradesDisplayExtension extends BaseExtension {
  private readonly currentDashboardService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly tradesHistoryService = inject(TradesHistoryService);

  private readonly translatorService = inject(TranslatorService);

  private readonly marketService = inject(MarketService);

  private tradesState: TradesState | null = null;

  private initTimezoneChangeSub: Subscription | null = null;

  private initTradesDisplaySub: Subscription | null = null;

  update(context: ChartContext): void {
    this.apply(context);
  }

  destroyState(): void {
    this.initTimezoneChangeSub?.unsubscribe();
    this.initTradesDisplaySub?.unsubscribe();
    this.tradesState?.destroy();
  }

  apply(context: ChartContext): void {
    this.tradesState?.destroy();
    if (!(context.settings.showTrades ?? false)) {
      return;
    }

    this.initTradesDisplay(context);
    this.initTimezoneChangeHandler(context);
  }

  private initTradesDisplay(context: ChartContext): void {
    const settings = context.settings;

    this.initTradesDisplaySub?.unsubscribe();
    this.initTradesDisplaySub = this.getCommonData().subscribe(x => {
      this.tradesState?.destroy();
      this.tradesState = new TradesState(context.settings as InstrumentKey);

      const currentPortfolio$ = this.currentDashboardService.selectedPortfolio$.pipe(
        tap(() => this.tradesState?.clear()),
        shareReplay(1)
      );

      // setup today trades
      this.tradesState?.onDestroy(
        currentPortfolio$.pipe(
          switchMap(portfolio => this.portfolioSubscriptionsService.getTradesSubscription(portfolio.portfolio, portfolio.exchange)),
          map(trades => trades.filter(t => t.targetInstrument.symbol === settings.symbol && t.targetInstrument.exchange === settings.exchange))
        ).subscribe(trades => {
          if (trades.length === 0) {
            return;
          }

          trades.forEach(trade => {
            this.tradesState?.addLoadedItem(trade);
            this.drawTrade(trade, context, x.exchanges, x.translator);
          });
        })
      );

      // setup history trades
      const visibleRangeChange$ = new Subject();
      const checkHistoryHandler = (): void => visibleRangeChange$.next({});

      this.getChartApi(context).onVisibleRangeChanged()
        .subscribe(null, checkHistoryHandler);

      this.tradesState?.onDestroy(() => {
        visibleRangeChange$.complete();
        this.getChartApi(context).onVisibleRangeChanged().unsubscribe(null, checkHistoryHandler);
      });

      const historyFillingSub = visibleRangeChange$.pipe(
        debounceTime(500),
      ).subscribe(() => {
        this.fillTradesHistoryCurrentRange(context, currentPortfolio$, x.exchanges, x.translator);
      });

      this.tradesState?.onDestroy(historyFillingSub);

      this.fillTradesHistoryCurrentRange(context, currentPortfolio$, x.exchanges, x.translator);
    });
  }

  private initTimezoneChangeHandler(context: ChartContext): void {
    this.initTimezoneChangeSub?.unsubscribe();
    const timezoneChangedHandler = (): void => this.initTradesDisplay(context);

    const timezoneApi = this.getChartApi(context).getTimezoneApi();

    timezoneApi.onTimezoneChanged()
      .subscribe(null, timezoneChangedHandler);

    this.initTimezoneChangeSub = new Subscription(() => {
      timezoneApi.onTimezoneChanged()
        .unsubscribe(null, timezoneChangedHandler);
    });
  }

  private drawTrade(
    trade: Trade,
    context: ChartContext,
    exchanges: MarketExchange[],
    translator: TranslatorFn): void {
    if (!this.tradesState) {
      return;
    }

    if (this.tradesState.instrument.exchange !== trade.targetInstrument.exchange
      || this.tradesState.instrument.symbol !== trade.targetInstrument.symbol) {
      return;
    }

    if (!(this.tradesState.isTradeDrawn(trade))) {
      const currentVisibleRange = context.host.activeChart().getVisibleRange();
      const tradeTime = Math.round(trade.date.getTime() / 1000);

      if (tradeTime < currentVisibleRange.from || tradeTime > currentVisibleRange.to) {
        return;
      }

      const settings = context.settings.trades ?? {
        marker: TradeDisplayMarker.Arrows,
        buyTradeColor: context.theme.themeColors.buyColorAccent,
        sellTradeColor: context.theme.themeColors.sellColorAccent,
        markerSize: 20
      };

      let shapeId: EntityId | null = null;
      switch (settings.marker) {
        case TradeDisplayMarker.Arrows: {
          shapeId = this.drawIconsShape(
            trade,
            this.getChartApi(context),
            settings,
            {buy: 0xf30c, sell: 0xf309}
          );
          break;
        }
        case TradeDisplayMarker.Carets: {
          shapeId = this.drawIconsShape(
            trade,
            this.getChartApi(context),
            settings,
            {buy: 0xf0d8, sell: 0xf0d7}
          );
          break;
        }
        default: {
          shapeId = this.drawNoteShape(
            trade,
            exchanges,
            this.getChartApi(context),
            settings,
            context.theme,
            translator
          );
        }
      }

      if (shapeId != null) {
        this.tradesState.markTradeDrawn(
          trade,
          {
            remove: () => {
              this.getChartApi(context).removeEntity(shapeId);
            }
          }
        );
      }
    }
  }

  private drawNoteShape(
    trade: Trade,
    exchanges: MarketExchange[],
    chartApi: IChartWidgetApi,
    settings: TechChartTradesDisplaySettings,
    theme: ThemeSettings,
    translator: TranslatorFn): EntityId | null {
    let chartSelectedTimezone: string | undefined = (chartApi.getTimezoneApi().getTimezone() as TimezoneInfo | undefined)?.id;
    if ((chartSelectedTimezone ?? 'exchange') === 'exchange') {
      const exchange = exchanges.find(x => x.exchange === trade.targetInstrument.exchange);
      chartSelectedTimezone = exchange?.settings.timezone;
    }

    const tradeDateStr = trade.date.toLocaleDateString(
      'RU-ru',
      {
        timeZone: chartSelectedTimezone
      }
    );

    const tradeTimeStr = trade.date.toLocaleTimeString(
      'RU-ru',
      {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: chartSelectedTimezone
      }
    );

    const tooltipParts = [
      `${translator(['sideLabel'])}: ${trade.side}`,
      `${translator(['priceLabel'])}: ${trade.price}`,
      `${translator(['qtyLabel'])}: ${trade.qtyBatch}`,
      `${translator(['timeLabel'])}: ${tradeDateStr} ${tradeTimeStr}`,
    ];

    const tradeTime = Math.round(trade.date.getTime() / 1000);

    return chartApi.createMultipointShape(
      [
        {
          time: tradeTime,
          price: trade.price
        }
      ],
      {
        lock: true,
        disableSelection: false,
        disableSave: true,
        disableUndo: true,
        shape: "note",
        text: tooltipParts.join(',\n'),
        zOrder: 'top',
        overrides: {
          markerColor: trade.side === Side.Buy ? settings.buyTradeColor : settings.sellTradeColor,
          backgroundColor: theme.themeColors.primaryColor,
          fontSize: 12,
          backgroundTransparency: 20,
          textColor: theme.themeColors.textMaxContrastColor
        }
      }
    );
  }

  private drawIconsShape(
    trade: Trade,
    chartApi: IChartWidgetApi,
    settings: TechChartTradesDisplaySettings,
    icons: { buy: number, sell: number }
  ): EntityId | null {
    const tradeTime = Math.round(trade.date.getTime() / 1000);

    return chartApi.createShape(
      {
        time: tradeTime,
        price: trade.price
      },
      {
        lock: true,
        disableSelection: false,
        disableSave: true,
        disableUndo: true,
        shape: "icon",
        // Full list of icons https://www.tradingview.com/charting-library-docs/latest/ui_elements/drawings/Drawings-List#icons
        icon: trade.side === Side.Buy ? icons.buy : icons.sell,
        zOrder: 'top',
        overrides: {
          // https://www.tradingview.com/charting-library-docs/latest/api/modules/Charting_Library/#drawingoverrides
          color: trade.side === Side.Buy ? settings.buyTradeColor : settings.sellTradeColor,
          size: settings.markerSize
        }
      }
    );
  }

  private fillTradesHistoryCurrentRange(
    chartContext: ChartContext,
    portfolioKey$: Observable<PortfolioKey>,
    exchanges: MarketExchange[],
    translator: TranslatorFn
  ): void {
    const visibleRange = this.getChartApi(chartContext).getVisibleRange();

    let startTradeId: string | null = null;
    const drawTrades = (): void => {
      this.tradesState?.getTradesForRange(visibleRange.from, visibleRange.to).forEach(t => {
        this.drawTrade(t, chartContext, exchanges, translator);
      });
    };

    const oldestLoadedTrade = this.tradesState?.getOldestTrade();
    if (oldestLoadedTrade) {
      if (visibleRange.from * 1000 < oldestLoadedTrade.date.getTime()) {
        startTradeId = oldestLoadedTrade.id;
      } else {
        drawTrades();
        return;
      }
    }

    portfolioKey$.pipe(
      switchMap(p => this.tradesHistoryService.getTradesHistoryForSymbol(
          p.exchange,
          p.portfolio,
          chartContext.settings.symbol,
          {
            from: startTradeId,
            limit: 50
          }
        )
      ),
      take(1)
    ).subscribe(historyTrades => {
      if (!historyTrades) {
        return;
      }

      if (historyTrades.length > 0) {
        const trades = historyTrades.filter(t => t.id !== startTradeId);
        if (trades.length === 0) {
          return;
        }

        trades.forEach(trade => {
          this.tradesState?.addLoadedItem(trade);
        });

        drawTrades();

        this.fillTradesHistoryCurrentRange(chartContext, portfolioKey$, exchanges, translator);
      }
    });
  }

  private getCommonData(): Observable<{ exchanges: MarketExchange[], translator: TranslatorFn }> {
    return combineLatest({
      exchanges: this.marketService.getAllExchanges(),
      translator: this.translatorService.getTranslator('tech-chart/tech-chart')
    }).pipe(
      shareReplay({bufferSize: 1, refCount: true})
    );
  }
}
