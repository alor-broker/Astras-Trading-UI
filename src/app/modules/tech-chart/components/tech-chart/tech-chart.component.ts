import { AfterViewInit, Component, DestroyRef, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  Observable,
  pairwise,
  shareReplay,
  Subject,
  Subscription,
  switchMap,
  take,
  tap,
  withLatestFrom
} from 'rxjs';
import {
  ChartingLibraryFeatureset,
  ChartingLibraryWidgetOptions,
  CustomTimezoneId,
  GmtTimezoneId,
  IChartingLibraryWidget,
  IOrderLineAdapter,
  IPositionLineAdapter,
  LanguageCode,
  PlusClickParams,
  ResolutionString,
  SubscribeEventsMap,
  TimeFrameType,
  TimeFrameValue,
  widget
} from '../../../../../assets/charting_library';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { TechChartDatafeedService } from '../../services/tech-chart-datafeed.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ThemeColors, ThemeSettings, ThemeType } from '../../../../shared/models/settings/theme-settings.model';
import { mapWith } from '../../../../shared/utils/observable-helper';
import { SelectedPriceData } from '../../../../shared/models/orders/selected-order-price.model';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { MathHelper } from '../../../../shared/utils/math-helper';
import { PortfolioSubscriptionsService } from '../../../../shared/services/portfolio-subscriptions.service';
import { PortfolioKey } from '../../../../shared/models/portfolio-key.model';
import { Position } from '../../../../shared/models/positions/position.model';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { Order, StopOrder } from '../../../../shared/models/orders/order.model';
import { Side } from '../../../../shared/models/enums/side.model';
import { OrderCancellerService } from '../../../../shared/services/order-canceller.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { TechChartSettings } from '../../models/tech-chart-settings.model';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { HashMap } from "@ngneat/transloco/lib/types";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TimezoneConverter } from "../../../../shared/utils/timezone-converter";
import { TimezoneDisplayOption } from "../../../../shared/models/enums/timezone-display-option";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { OrdersDialogService } from "../../../../shared/services/orders/orders-dialog.service";
import { toInstrumentKey } from "../../../../shared/utils/instruments";
import { EditOrderDialogParams, OrderType } from "../../../../shared/models/orders/orders-dialog.model";
import { WidgetsSharedDataService } from "../../../../shared/services/widgets-shared-data.service";
import { Trade } from "../../../../shared/models/trades/trade.model";
import { TradesHistoryService } from "../../../../shared/services/trades-history.service";
import { addSeconds } from "../../../../shared/utils/datetime";
import { LessMore } from "../../../../shared/models/enums/less-more.model";
import { getConditionSign, getConditionTypeByString } from "../../../../shared/utils/order-conditions-helper";

type ExtendedSettings = { widgetSettings: TechChartSettings, instrument: Instrument };

interface IRemovableChartItem {
  remove(): void;
}

class PositionState {
  positionLine: IPositionLineAdapter | null = null;

  constructor(private tearDown: Subscription) {
    tearDown.add(() => {
      try {
        this.positionLine?.remove();
      } catch {
      }
    });
  }

  destroy() {
    this.tearDown.unsubscribe();
  }
}

class OrdersState {
  readonly limitOrders = new Map<string, IOrderLineAdapter>();
  readonly stopOrders = new Map<string, IOrderLineAdapter>();

  constructor(private tearDown: Subscription) {
  }

  destroy() {
    this.tearDown.add(() => {
      this.clear();
    });

    this.tearDown.unsubscribe();
  }

  clear() {
    this.clearOrders(this.limitOrders);
    this.clearOrders(this.stopOrders);
  }

  private clearOrders(orders: Map<string, IOrderLineAdapter>) {
    orders.forEach(value => {
      try {
        value.remove();
      } catch {
      }
    });

    orders.clear();
  }
}

class TradesState {
  private readonly drawnTrades = new Map<string, IRemovableChartItem>();
  private loadedData = new Map<string, Trade>();
  private oldestTrade: Trade | null = null;

  constructor(private tearDown: Subscription, public readonly instrument: InstrumentKey) {
  }

  addLoadedItem(item: Trade) {
    this.loadedData.set(item.id, item);

    if(!this.oldestTrade || this.oldestTrade.date.getTime() > item.date.getTime()) {
      this.oldestTrade = item;
    }
  }

  isTradeDrawn(trade: Trade): boolean {
    return this.drawnTrades.has(trade.id);
  }

  markTradeDrawn(trade: Trade, removableItem: IRemovableChartItem) {
    this.drawnTrades.set(trade.id, removableItem);
  }

  getOldestTrade(): Trade | null {
    return this.oldestTrade;
  }

  getTradesForRange(fromSec: number, toSec: number) {
    return Array.from(this.loadedData.values())
      .filter(t => {
        const tradeTime = Math.round(t.date.getTime() / 1000);
        return tradeTime >= fromSec && tradeTime <= toSec;
      });
  }

  destroy() {
    this.tearDown.add(() => {
      this.clear();
    });

    this.tearDown.unsubscribe();
  }

  clear() {
    this.drawnTrades.forEach(t => {
      try {
        t.remove();
      } catch {
      }
    });

    this.drawnTrades.clear();
    this.loadedData.clear();
    this.oldestTrade = null;
  }
}

interface ChartState {
  widget: IChartingLibraryWidget;
  positionState?: PositionState;
  ordersState?: OrdersState;
  tradesState?: TradesState;
}

@Component({
  selector: 'ats-tech-chart',
  templateUrl: './tech-chart.component.html',
  styleUrls: ['./tech-chart.component.less'],
  providers: [TechChartDatafeedService]
})
export class TechChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input({required: true})
  guid!: string;

  @ViewChild('chartContainer', { static: true })
  chartContainer?: ElementRef<HTMLElement>;

  private readonly selectedPriceProviderName = 'selectedPrice';
  private chartState?: ChartState;
  private settings$?: Observable<ExtendedSettings>;
  private allActivePositions$?: Observable<Position[]>;
  private chartEventSubscriptions: { event: (keyof SubscribeEventsMap), callback: SubscribeEventsMap[keyof SubscribeEventsMap] }[] = [];
  private lastTheme?: ThemeSettings;
  private lastLang?: string;
  private lastTimezone?: TimezoneDisplayOption;
  private translateFn!: (key: string[], params?: HashMap) => string;
  private intervalChangeSub?: Subscription;
  private timezoneChangeSub?: Subscription;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly techChartDatafeedService: TechChartDatafeedService,
    private readonly themeService: ThemeService,
    private readonly instrumentsService: InstrumentsService,
    private readonly widgetsSharedDataService: WidgetsSharedDataService,
    private readonly ordersDialogService: OrdersDialogService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly currentDashboardService: DashboardContextService,
    private readonly orderCancellerService: OrderCancellerService,
    private readonly translatorService: TranslatorService,
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly tradesHistoryService: TradesHistoryService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.initSettingsStream();
    this.initPositionStream();
  }

  ngOnDestroy() {
    if (this.chartState) {
      this.clearChartEventsSubscription(this.chartState.widget);
      this.chartState.ordersState?.destroy();
      this.chartState.positionState?.destroy();
      this.chartState.tradesState?.destroy();
      this.intervalChangeSub?.unsubscribe();
      this.timezoneChangeSub?.unsubscribe();
      this.chartState.widget.remove();
    }

    this.techChartDatafeedService.clear();
  }

  ngAfterViewInit(): void {
    // chart should be redrawn only if instrument changed but not chart settings
    const chartSettings$ = this.settings$!.pipe(
      distinctUntilChanged((previous, current) => {
        return (
          previous?.widgetSettings?.symbol === current?.widgetSettings?.symbol &&
          previous?.widgetSettings?.exchange === current?.widgetSettings?.exchange
        );
      }),
    );

    const linkToActiveChange$ = this.settings$!.pipe(
      startWith(null),
      pairwise(),
      withLatestFrom(this.techChartDatafeedService.onSymbolChange),
      filter(([[prev, curr], chartInstrument]) => {
        if (!prev) {
          return true;
        }
        return !prev?.widgetSettings.linkToActive && !!curr?.widgetSettings?.linkToActive &&
          (chartInstrument?.symbol !== curr?.instrument.symbol || chartInstrument?.exchange !== curr?.instrument.exchange);
      })
    );

    combineLatest([
      chartSettings$,
      this.themeService.getThemeSettings(),
      this.translatorService.getTranslator('tech-chart/tech-chart'),
      this.timezoneConverterService.getConverter(),
      linkToActiveChange$
    ]).pipe(
      map(([, theme, translator, timezoneConverter]) => ({
        theme,
        translator,
        timezoneConverter
      })),
      // read settings with recent changes
      withLatestFrom(this.settings$!),
      map(([source, settings]) => ({
        ...source,
        settings
      })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      this.translateFn = x.translator;
      this.createChart(
        x.settings.widgetSettings,
        x.theme,
        x.timezoneConverter,
        this.lastTheme && this.lastTheme.theme !== x.theme.theme
        || this.lastLang !== this.translatorService.getActiveLang()
        || this.lastTimezone !== x.timezoneConverter.displayTimezone
      );

      this.lastTheme = x.theme;
      this.lastLang = this.translatorService.getActiveLang();
      this.lastTimezone = x.timezoneConverter.displayTimezone;
    });
  }

  private initSettingsStream() {
    const getInstrumentInfo = (settings: TechChartSettings) => this.instrumentsService.getInstrument(settings).pipe(
      filter((x): x is Instrument => !!x)
    );

    this.settings$ = this.settingsService.getSettings<TechChartSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => this.isEqualTechChartSettings(previous, current)),
      mapWith(
        settings => getInstrumentInfo(settings),
        (widgetSettings, instrument) => ({ widgetSettings, instrument } as ExtendedSettings)
      ),
      shareReplay(1)
    );
  }

  private isEqualTechChartSettings(
    settings1?: TechChartSettings,
    settings2?: TechChartSettings
  ) {
    if (settings1 && settings2) {
      return (
        settings1.linkToActive == settings2.linkToActive &&
        settings1.guid == settings2.guid &&
        settings1.symbol == settings2.symbol &&
        settings1.exchange == settings2.exchange &&
        settings1.chartSettings == settings2.chartSettings &&
        settings1.badgeColor == settings2.badgeColor
      );
    } else return false;
  }

  private initPositionStream() {
    this.allActivePositions$ = this.getCurrentPortfolio().pipe(
      switchMap(portfolio => this.portfolioSubscriptionsService.getAllPositionsSubscription(portfolio.portfolio, portfolio.exchange)),
      map((positions => positions.filter(p => p.avgPrice && p.qtyTFutureBatch))),
      startWith([])
    );
  }

  private createChart(
    settings: TechChartSettings,
    theme: ThemeSettings,
    timezoneConverter: TimezoneConverter,
    forceRecreate: boolean = false) {
    if (this.chartState) {
      if (forceRecreate) {
        this.intervalChangeSub?.unsubscribe();
        this.chartState.widget?.remove();
      }
      else {
        this.chartState.widget.activeChart().setSymbol(
          this.toTvSymbol(settings),
          () => {
            this.initPositionDisplay(settings, theme.themeColors);
            this.initOrdersDisplay(settings, theme.themeColors);
            this.initTradesDisplay(settings, theme.themeColors);
            this.initTimezoneChangeStream(settings, theme.themeColors);
          }
        );

        return;
      }
    }

    if (!this.chartContainer) {
      return;
    }

    const currentTimezone = timezoneConverter.getTimezone();

    const config: ChartingLibraryWidgetOptions = {
      // debug
      debug: false,
      // base options
      container: this.chartContainer.nativeElement,
      symbol: this.toTvSymbol(settings),
      interval: ((<any>settings.chartLayout)?.charts?.[0]?.panes?.[0]?.sources?.[0]?.state?.interval ?? '1D') as ResolutionString,
      locale: this.translatorService.getActiveLang() as LanguageCode,
      library_path: '/assets/charting_library/',
      datafeed: this.techChartDatafeedService,
      // additional options
      fullscreen: false,
      autosize: true,
      timezone: currentTimezone.name as any,
      custom_timezones: [
        {
          id: currentTimezone.name as CustomTimezoneId,
          alias: `Etc/GMT${currentTimezone.utcOffset > 0 ? '+' : '-'}${currentTimezone.formattedOffset}` as GmtTimezoneId,
          title: currentTimezone.name
        }
      ],
      theme: theme.theme === ThemeType.default ? 'light' : 'dark',
      saved_data: settings.chartLayout,
      auto_save_delay: 1,
      time_frames: [
        { text: '1000y', resolution: '1M' as ResolutionString, description: this.translateFn(['timeframes', 'all', 'desc']), title: this.translateFn(['timeframes', 'all', 'title']) },
        { text: '3y', resolution: '1M' as ResolutionString, description: this.translateFn(['timeframes', '3y', 'desc']), title: this.translateFn(['timeframes', '3y', 'title']) },
        { text: '1y', resolution: '1D' as ResolutionString, description: this.translateFn(['timeframes', '1y', 'desc']), title: this.translateFn(['timeframes', '1y', 'title']) },
        { text: '6m', resolution: '1D' as ResolutionString, description: this.translateFn(['timeframes', '6m', 'desc']), title: this.translateFn(['timeframes', '6m', 'title']) },
        { text: '3m', resolution: '4H' as ResolutionString, description: this.translateFn(['timeframes', '3m', 'desc']), title: this.translateFn(['timeframes', '3m', 'title']) },
        { text: '1m', resolution: '1H' as ResolutionString, description: this.translateFn(['timeframes', '1m', 'desc']), title: this.translateFn(['timeframes', '1m', 'title']) },
        { text: '14d', resolution: '1H' as ResolutionString, description: this.translateFn(['timeframes', '2w', 'desc']), title: this.translateFn(['timeframes', '2w', 'title']) },
        { text: '7d', resolution: '15' as ResolutionString, description: this.translateFn(['timeframes', '1w', 'desc']), title: this.translateFn(['timeframes', '1w', 'title']) },
        { text: '1d', resolution: '5' as ResolutionString, description: this.translateFn(['timeframes', '1d', 'desc']), title: this.translateFn(['timeframes', '1d', 'title']) },
      ],
      symbol_search_request_delay: 2000,
      //features
      disabled_features: [
        'symbol_info',
        'display_market_status',
        'symbol_search_hot_key',
        'save_shortcut',
        'save_chart_properties_to_local_storage',
      ],
      enabled_features: [
        'header_symbol_search',
        'side_toolbar_in_fullscreen_mode',
        'chart_crosshair_menu',
        'show_spread_operators',
        'seconds_resolution'
      ] as unknown as ChartingLibraryFeatureset[]
    };

    const chartWidget = new widget(config);
    this.subscribeToChartEvents(chartWidget);

    this.chartState = {
      widget: chartWidget
    };

    chartWidget.onChartReady(() => {
      this.chartState?.widget!.activeChart().dataReady(() => {
          this.initPositionDisplay(settings, theme.themeColors);
          this.initOrdersDisplay(settings, theme.themeColors);
          this.initTradesDisplay(settings, theme.themeColors);
          this.initTimezoneChangeStream(settings, theme.themeColors);
        }
      );

      this.techChartDatafeedService.onSymbolChange.pipe(
        takeUntilDestroyed(this.destroyRef),
        mapWith(
          () => this.settings$!.pipe(take(1)),
          (instrument, settings) =>
            (instrument?.symbol !== settings.instrument.symbol ||
            instrument?.exchange !== settings.instrument.exchange) &&
            settings.widgetSettings.linkToActive
        ),
        filter(needUnlink => !!needUnlink)
      )
        .subscribe(() => this.settingsService.updateIsLinked(this.guid, false));

      this.intervalChangeSub = new Subscription();

      this.chartState!.widget.activeChart().onIntervalChanged()
        .subscribe(null, this.intervalChangeCallback);

      this.intervalChangeSub.add(() => this.chartState?.widget!.activeChart().onIntervalChanged().unsubscribe(null, this.intervalChangeCallback));
    });
  }

  private intervalChangeCallback: (interval: ResolutionString, timeFrameParameters: { timeframe?: TimeFrameValue }) => void =
    (interval, timeframeObj) => {
      if (interval.includes('S')) {
        timeframeObj.timeframe = {
          from: Math.round(addSeconds(new Date(), +interval.slice(0, -1) * -100).getTime() / 1000),
          to: Math.round(new Date().getTime() / 1000),
          type: TimeFrameType.TimeRange
        };
      }
    };

  private toTvSymbol(instrumentKey: InstrumentKey): string {
    return `[${instrumentKey.exchange}:${instrumentKey.symbol}:${instrumentKey.instrumentGroup ?? ''}]`;
  }

  private subscribeToChartEvents(widget: IChartingLibraryWidget) {
    this.subscribeToChartEvent(
      widget,
      'onPlusClick',
      (params: PlusClickParams) => this.selectPrice(params.price)
    );

    this.subscribeToChartEvent(
      widget,
      'onAutoSaveNeeded',
      () => this.saveChartLayout(widget)
    );
  }

  private saveChartLayout(widget: IChartingLibraryWidget) {
    widget.save(state => {
      this.settingsService.updateSettings<TechChartSettings>(
        this.guid,
        {
          chartLayout: state
        }
      );
    });
  }

  private subscribeToChartEvent(target: IChartingLibraryWidget, event: (keyof SubscribeEventsMap), callback: SubscribeEventsMap[keyof SubscribeEventsMap]) {
    this.chartEventSubscriptions.push({ event: event, callback });
    target.subscribe(event, callback);
  }

  private clearChartEventsSubscription(target: IChartingLibraryWidget) {
    this.chartEventSubscriptions.forEach(subscription => target.unsubscribe(subscription.event, subscription.callback));
    this.chartEventSubscriptions = [];
  }

  private selectPrice(price: number) {
    this.settings$?.pipe(
      mapWith(
        settings => this.settingsService.getSettingsByColor(settings.widgetSettings.badgeColor ?? ''),
        (widgetSettings, relatedSettings) => ({ widgetSettings, relatedSettings })),
      take(1)
    ).subscribe(({ widgetSettings, relatedSettings }) => {
      const submitOrderWidgetSettings = relatedSettings.filter(x => x.settingsType === 'OrderSubmitSettings');
      const roundedPrice = MathHelper.roundByMinStepMultiplicity(price, widgetSettings.instrument.minstep);

      if (submitOrderWidgetSettings.length === 0 || !widgetSettings.widgetSettings.badgeColor) {
        this.ordersDialogService.openNewOrderDialog({
          instrumentKey: toInstrumentKey(widgetSettings.widgetSettings),
          initialValues: {
            orderType: OrderType.Limit,
            price: roundedPrice,
            quantity: 1
          }
        });
      }
      else {
        this.widgetsSharedDataService.setDataProviderValue<SelectedPriceData>(this.selectedPriceProviderName, {
          price: roundedPrice,
          badgeColor: widgetSettings.widgetSettings.badgeColor
        });
      }
    });
  }

  private getCurrentPortfolio(): Observable<PortfolioKey> {
    return this.currentDashboardService.selectedPortfolio$;
  }

  private initPositionDisplay(instrument: InstrumentKey, themeColors: ThemeColors) {
    this.chartState!.positionState?.destroy();

    const tearDown = new Subscription();
    this.chartState!.positionState = new PositionState(tearDown);

    const subscription = this.allActivePositions$!.pipe(
      map(x => x.find(p => p.symbol === instrument.symbol && p.exchange === instrument.exchange)),
      distinctUntilChanged((p, c) => p?.avgPrice === c?.avgPrice && p?.qtyTFutureBatch === c?.qtyTFutureBatch),
    ).subscribe(position => {
      const positionState = this.chartState!.positionState!;
      if (!position) {
        positionState.positionLine?.remove();
        positionState.positionLine = null;
        return;
      }

      if (!positionState.positionLine) {
        try {
          positionState.positionLine = this.chartState!.widget.activeChart()
            .createPositionLine()
            .setText(this.translateFn(['position']));
        } catch {
          return;
        }
      }

      const color = position.qtyTFutureBatch >= 0
        ? themeColors.buyColor
        : themeColors.sellColor;

      const backgroundColor = position.qtyTFutureBatch >= 0
        ? themeColors.buyColorBackground
        : themeColors.sellColorBackground;

      positionState.positionLine
        .setQuantity(position.qtyTFutureBatch.toString())
        .setPrice(position.avgPrice)
        .setLineColor(color)
        .setBodyBackgroundColor(themeColors.componentBackground)
        .setBodyBorderColor(color)
        .setQuantityBackgroundColor(color)
        .setQuantityBorderColor(backgroundColor)
        .setQuantityTextColor(themeColors.chartPrimaryTextColor)
        .setBodyTextColor(themeColors.chartPrimaryTextColor);
    });

    tearDown.add(subscription);
  }

  private initOrdersDisplay(instrument: InstrumentKey, themeColors: ThemeColors) {
    this.chartState!.ordersState?.destroy();

    const tearDown = new Subscription();
    this.chartState!.ordersState = new OrdersState(tearDown);

    tearDown.add(this.setupOrdersUpdate(
      this.getLimitOrdersStream(instrument),
      this.chartState!.ordersState.limitOrders,
      (order, orderLineAdapter) => {
        this.fillOrderBaseParameters(order, orderLineAdapter, themeColors);
        this.fillLimitOrder(order, orderLineAdapter);
      }
    ));

    tearDown.add(this.setupOrdersUpdate(
      this.getStopOrdersStream(instrument),
      this.chartState!.ordersState.stopOrders,
      (order, orderLineAdapter) => {
        this.fillOrderBaseParameters(order, orderLineAdapter, themeColors);
        this.fillStopOrder(order, orderLineAdapter);
      }
    ));
  }

  private initTimezoneChangeStream(settings: TechChartSettings, themeColors: ThemeColors) {
    this.timezoneChangeSub?.unsubscribe();
    this.timezoneChangeSub = new Subscription();

    const timezoneChangeCallback = () => this.initTradesDisplay(settings, themeColors);
    this.chartState?.widget.activeChart().getTimezoneApi().onTimezoneChanged().subscribe(null, timezoneChangeCallback);
    this.timezoneChangeSub.add(() => this.chartState?.widget.activeChart().getTimezoneApi().onTimezoneChanged().unsubscribe(null, timezoneChangeCallback));
  }

  private initTradesDisplay(settings: TechChartSettings, themeColors: ThemeColors) {
    if(!settings.showTrades) {
      return;
    }

    this.chartState!.tradesState?.destroy();

    const tearDown = new Subscription();
    this.chartState!.tradesState = new TradesState(tearDown, settings);

    const currentPortfolio$ = this.getCurrentPortfolio().pipe(
      tap( () => this.chartState?.tradesState?.clear()),
      shareReplay(1)
    );

    // setup today trades
    tearDown.add(
      currentPortfolio$.pipe(
        switchMap(portfolio => this.portfolioSubscriptionsService.getTradesSubscription(portfolio.portfolio, portfolio.exchange)),
        map(trades => trades.filter(t => t.symbol === settings.symbol && t.exchange === settings.exchange))
      ).subscribe(trades => {
        if(trades.length === 0) {
          return;
        }

        trades.forEach(trade => {
          this.chartState?.tradesState?.addLoadedItem(trade);
          this.drawTrade(trade, themeColors);
        });
      })
    );

    //setup history trades
    const visibleRangeChange$ = new Subject();
    const checkHistoryCallback = () => visibleRangeChange$.next({});

    this.chartState?.widget.activeChart().onVisibleRangeChanged().subscribe(null, checkHistoryCallback);
    tearDown.add(() => visibleRangeChange$.complete());
    tearDown.add(() => this.chartState?.widget?.activeChart().onVisibleRangeChanged().unsubscribe(null, checkHistoryCallback));

    visibleRangeChange$.pipe(
      debounceTime(500),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.fillTradesHistoryCurrentRange(settings, currentPortfolio$, themeColors);
    });

    this.fillTradesHistoryCurrentRange(settings, currentPortfolio$, themeColors);
  }

  private drawTrade(trade: Trade, themeColors: ThemeColors) {
    if(!this.chartState?.tradesState) {
      return;
    }

    if(this.chartState?.tradesState.instrument.exchange !== trade.exchange
      || this.chartState?.tradesState.instrument.symbol !== trade.symbol) {
      return;
    }

    if(this.chartState?.tradesState?.isTradeDrawn(trade) === false) {

      const currentVisibleRange = this.chartState.widget.activeChart().getVisibleRange();
      const tradeTime = Math.round(trade.date.getTime() / 1000);

      if(tradeTime < currentVisibleRange.from || tradeTime > currentVisibleRange.to) {
        return;
      }

      let chartSelectedTimezone: string | undefined = this.chartState?.widget.activeChart().getTimezoneApi().getTimezone()?.id;
      if (!chartSelectedTimezone || chartSelectedTimezone === 'exchange') {
        chartSelectedTimezone = TimezoneConverter.moscowTimezone;
      }

      const text = `${this.translateFn(['sideLabel'])}: ${trade.side},
      ${this.translateFn(['priceLabel'])}: ${trade.price},
      ${this.translateFn(['qtyLabel'])}: ${trade.qtyBatch}
      ${this.translateFn(['timeLabel'])}: ${
        trade.date.toLocaleDateString(
          'RU-ru',
          {
            timeZone: chartSelectedTimezone
          }
        )
      } ${
        trade.date.toLocaleTimeString(
          'RU-ru',
          {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: chartSelectedTimezone
          }
        )
      }`;

      const shapeId = this.chartState.widget.activeChart().createMultipointShape(
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
          text: text,
          zOrder: 'top',
          overrides: {
            markerColor: trade.side === Side.Buy ? themeColors.buyColorAccent : themeColors.sellColorAccent,
            backgroundColor: themeColors.primaryColor,
            fontsize: 10
          }
        }
      );

      if(!!shapeId) {
        this.chartState.tradesState.markTradeDrawn(
          trade,
          {
            remove: () => {
              this.chartState?.widget.activeChart()?.removeEntity(shapeId);
            }
          }
        );
      }
    }
  }

  private fillTradesHistoryCurrentRange(
    instrument: InstrumentKey,
    portfolioKey$: Observable<PortfolioKey>,
    themeColors: ThemeColors
  ) {
    const visibleRange = this.chartState?.widget.activeChart().getVisibleRange();
    if(!visibleRange) {
      return;
    }

    let startTradeId: string | null = null;
    const drawTrades = () => {
      this.chartState?.tradesState?.getTradesForRange(visibleRange.from, visibleRange.to).forEach(t => {
        this.drawTrade(t, themeColors);
      });
    };

    const oldestLoadedTrade = this.chartState?.tradesState?.getOldestTrade();
    if(oldestLoadedTrade) {
      if(visibleRange.from * 1000 < oldestLoadedTrade.date.getTime()) {
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
          instrument.symbol,
          {
            from: startTradeId,
            limit: 50
          }
        )
      ),
      take(1)
    ).subscribe(historyTrades => {
      if(!historyTrades) {
        return;
      }

      if(historyTrades.length > 0) {
        const trades = historyTrades.filter(t => t.id !== startTradeId);
        if(trades.length === 0) {
          return;
        }

        trades.forEach(trade => {
          this.chartState?.tradesState?.addLoadedItem(trade);
        });

        drawTrades();

        this.fillTradesHistoryCurrentRange(instrument, portfolioKey$, themeColors);
      }
    });
  }

  private setupOrdersUpdate<T extends Order>(
    data$: Observable<T[]>,
    state: Map<string, IOrderLineAdapter>,
    fillOrderLine: (order: T, orderLineAdapter: IOrderLineAdapter) => void): Subscription {
    const removeItem = (itemKey: string) => {
      try {
        state.get(itemKey)?.remove();
      } catch {
      }

      state.delete(itemKey);
    };

    return data$.subscribe(
      orders => {
        Array.from(state.keys()).forEach(orderId => {
          if (!orders.find(o => o.id === orderId)) {
            removeItem(orderId);
          }
        });

        orders.forEach(order => {
          const existingOrderLine = state.get(order.id);
          if (order.status !== 'working') {
            if (existingOrderLine) {
              removeItem(order.id);

            }

            return;
          }

          if (!existingOrderLine) {
            const orderLine = this.chartState!.widget.activeChart().createOrderLine();
            fillOrderLine(order, orderLine);
            state.set(order.id, orderLine);
          }
        });
      }
    );
  }

  private getLimitOrdersStream(instrumentKey: InstrumentKey): Observable<Order[]> {
    return this.getCurrentPortfolio().pipe(
      switchMap(portfolio => this.portfolioSubscriptionsService.getOrdersSubscription(portfolio.portfolio, portfolio.exchange)),
      map(orders => orders.allOrders.filter(o => o.type === 'limit')),
      debounceTime(100),
      map(orders => orders.filter(o => o.symbol === instrumentKey.symbol && o.exchange === instrumentKey.exchange)),
      startWith([])
    );
  }

  private getStopOrdersStream(instrumentKey: InstrumentKey): Observable<StopOrder[]> {
    return this.getCurrentPortfolio().pipe(
      switchMap(portfolio => this.portfolioSubscriptionsService.getStopOrdersSubscription(portfolio.portfolio, portfolio.exchange)),
      map(orders => orders.allOrders),
      debounceTime(100),
      map(orders => orders.filter(o => o.symbol === instrumentKey.symbol && o.exchange === instrumentKey.exchange)),
      startWith([])
    );
  }

  private fillOrderBaseParameters(order: Order, orderLineAdapter: IOrderLineAdapter, themeColors: ThemeColors) {
    orderLineAdapter
      .setQuantity((order.qtyBatch - (order.filledQtyBatch ?? 0)).toString())
      .setQuantityBackgroundColor(themeColors.componentBackground)
      .setQuantityTextColor(themeColors.chartPrimaryTextColor)
      .setQuantityBorderColor(themeColors.primaryColor)
      .setBodyBorderColor(themeColors.primaryColor)
      .setBodyBackgroundColor(themeColors.componentBackground)
      .setLineStyle(2)
      .setLineColor(themeColors.primaryColor)
      .setCancelButtonBackgroundColor(themeColors.componentBackground)
      .setCancelButtonBorderColor('transparent')
      .setCancelButtonIconColor(themeColors.primaryColor)
      .setBodyTextColor(order.side === Side.Buy ? themeColors.buyColor : themeColors.sellColor);
  }

  private fillLimitOrder(order: Order, orderLineAdapter: IOrderLineAdapter) {
    const getEditCommand = () => ({
      orderId: order.id,
      orderType: OrderType.Limit,
      instrumentKey: {
        symbol: order.symbol,
        exchange: order.exchange
      },
      portfolioKey: {
        portfolio: order.portfolio,
        exchange: order.exchange
      },
      initialValues: {}
    } as EditOrderDialogParams);

    orderLineAdapter.setText('L')
      .setTooltip(`${this.translateFn([order.side === Side.Buy ? 'buy' : 'sell'])} ${this.translateFn(['limit'])}`)
      .setPrice(order.price)
      .onCancel(() => this.orderCancellerService.cancelOrder({
          orderid: order.id,
          portfolio: order.portfolio,
          exchange: order.exchange,
          stop: false
        }).subscribe()
      )
      .onModify(() => this.ordersDialogService.openEditOrderDialog(getEditCommand()))
      .onMove(() => {
          const params = {
            ...getEditCommand(),
            cancelCallback: () => orderLineAdapter.setPrice(order.price)
          };

          params.initialValues = {
            ...params.initialValues,
            price: orderLineAdapter.getPrice()
          };
          this.ordersDialogService.openEditOrderDialog(params);
        }
      );
  }

  private fillStopOrder(order: StopOrder, orderLineAdapter: IOrderLineAdapter) {
    const conditionType: LessMore = getConditionTypeByString(order.conditionType)!;
    const orderText = 'S'
      + (order.type === 'stoplimit' ? 'L' : 'M')
      + ' '
      + getConditionSign(conditionType);

    const orderTooltip = this.translateFn([order.side === Side.Buy ? 'buy' : 'sell'])
      + ' '
      + this.translateFn([order.type === 'stoplimit' ? 'stopLimit' : 'stopMarket'])
      + ' ('
      + this.translateFn([conditionType ?? ''])
      + ')';

    const getEditCommand = () => ({
      orderId: order.id,
      orderType: OrderType.Stop,
      instrumentKey: {
        symbol: order.symbol,
        exchange: order.exchange
      },
      portfolioKey: {
        portfolio: order.portfolio,
        exchange: order.exchange
      },
      initialValues: {}
    } as EditOrderDialogParams);

    orderLineAdapter
      .setText(orderText)
      .setTooltip(orderTooltip)
      .setPrice(order.triggerPrice)
      .onCancel(() => this.orderCancellerService.cancelOrder({
          orderid: order.id,
          portfolio: order.portfolio,
          exchange: order.exchange,
          stop: true
        }).subscribe()
      )
      .onModify(() => this.ordersDialogService.openEditOrderDialog(getEditCommand()))
      .onMove(() => {
        const params = {
          ...getEditCommand(),
          cancelCallback: () => orderLineAdapter.setPrice(order.triggerPrice)
        };

        params.initialValues = {
          ...params.initialValues,
          price: orderLineAdapter.getPrice()
        };
        this.ordersDialogService.openEditOrderDialog(params);
      }
    );
  }
}
