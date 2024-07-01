import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  fromEvent,
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
  ChartMetaInfo,
  ChartTemplate,
  ChartTemplateContent,
  CustomTimezoneId,
  GmtTimezoneId,
  IChartingLibraryWidget,
  IExternalSaveLoadAdapter,
  IOrderLineAdapter,
  IPositionLineAdapter,
  LanguageCode,
  LineToolsAndGroupsState,
  PlusClickParams,
  ResolutionString,
  StudyTemplateMetaInfo,
  SubscribeEventsMap,
  TimeFrameType,
  TimeFrameValue,
  Timezone,
  TimezoneInfo,
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
import { Order, OrderType, StopOrder } from '../../../../shared/models/orders/order.model';
import { Side } from '../../../../shared/models/enums/side.model';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { LineMarkerPosition, TechChartSettings } from '../../models/tech-chart-settings.model';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { HashMap } from "@ngneat/transloco/lib/types";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TimezoneConverter } from "../../../../shared/utils/timezone-converter";
import { TimezoneDisplayOption } from "../../../../shared/models/enums/timezone-display-option";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { OrdersDialogService } from "../../../../shared/services/orders/orders-dialog.service";
import { defaultBadgeColor, toInstrumentKey } from "../../../../shared/utils/instruments";
import { EditOrderDialogParams, OrderFormType } from "../../../../shared/models/orders/orders-dialog.model";
import { WidgetsSharedDataService } from "../../../../shared/services/widgets-shared-data.service";
import { Trade } from "../../../../shared/models/trades/trade.model";
import { TradesHistoryService } from "../../../../shared/services/trades-history.service";
import { addSeconds } from "../../../../shared/utils/datetime";
import { LessMore } from "../../../../shared/models/enums/less-more.model";
import { getConditionSign, getConditionTypeByString } from "../../../../shared/utils/order-conditions-helper";
import { SyntheticInstrumentsHelper } from "../../utils/synthetic-instruments.helper";
import { RegularInstrumentKey, SyntheticInstrumentKey } from "../../models/synthetic-instruments.model";
import { SyntheticInstrumentsService } from "../../services/synthetic-instruments.service";
import { MarketService } from "../../../../shared/services/market.service";
import { MarketExchange } from "../../../../shared/models/market-settings.model";
import { DeviceService } from "../../../../shared/services/device.service";
import { DeviceInfo } from "../../../../shared/models/device-info.model";
import { ChartTemplatesSettingsBrokerService } from "../../services/chart-templates-settings-broker.service";
import { LocalStorageService } from "../../../../shared/services/local-storage.service";
import { ACTIONS_CONTEXT, ActionsContext } from "../../../../shared/services/actions-context";
import { WsOrdersService } from "../../../../shared/services/orders/ws-orders.service";
import { InstrumentSearchService } from "../../services/instrument-search.service";
import { isInstrumentEqual } from "../../../../shared/utils/settings-helper";
import { SearchButtonHelper } from "../../utils/search-button.helper";
import { DOCUMENT } from "@angular/common";

type ExtendedSettings = { widgetSettings: TechChartSettings, instrument: Instrument };

interface IRemovableChartItem {
  remove(): void;
}

class PositionState {
  positionLine: IPositionLineAdapter | null = null;

  constructor(private readonly tearDown: Subscription) {
    tearDown.add(() => {
      try {
        this.positionLine?.remove();
      } catch {
      }
    });
  }

  destroy(): void {
    this.tearDown.unsubscribe();
  }
}

class OrdersState {
  readonly limitOrders = new Map<string, IOrderLineAdapter>();
  readonly stopOrders = new Map<string, IOrderLineAdapter>();

  constructor(private readonly tearDown: Subscription) {
  }

  destroy(): void {
    this.tearDown.add(() => {
      this.clear();
    });

    this.tearDown.unsubscribe();
  }

  clear(): void {
    this.clearOrders(this.limitOrders);
    this.clearOrders(this.stopOrders);
  }

  private clearOrders(orders: Map<string, IOrderLineAdapter>): void {
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
  private readonly loadedData = new Map<string, Trade>();
  private oldestTrade: Trade | null = null;

  constructor(private readonly tearDown: Subscription, public readonly instrument: InstrumentKey) {
  }

  addLoadedItem(item: Trade): void {
    this.loadedData.set(item.id, item);

    if(!this.oldestTrade || this.oldestTrade.date.getTime() > item.date.getTime()) {
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
    this.tearDown.add(() => {
      this.clear();
    });

    this.tearDown.unsubscribe();
  }

  clear(): void {
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
  private settings$!: Observable<ExtendedSettings>;
  private allActivePositions$?: Observable<Position[]>;
  private chartEventSubscriptions: { event: (keyof SubscribeEventsMap), callback: SubscribeEventsMap[keyof SubscribeEventsMap] }[] = [];
  private lastTheme?: ThemeSettings;
  private lastLang?: string;
  private lastTimezone?: TimezoneDisplayOption;
  private translateFn!: (key: string[], params?: HashMap) => string;
  private intervalChangeSub?: Subscription;
  private timezoneChangeSub?: Subscription;
  private symbolChangeSub?: Subscription;
  private isChartFocused = false;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly techChartDatafeedService: TechChartDatafeedService,
    private readonly themeService: ThemeService,
    private readonly instrumentsService: InstrumentsService,
    private readonly syntheticInstrumentsService: SyntheticInstrumentsService,
    private readonly widgetsSharedDataService: WidgetsSharedDataService,
    private readonly ordersDialogService: OrdersDialogService,
    private readonly wsOrdersService: WsOrdersService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly currentDashboardService: DashboardContextService,
    private readonly translatorService: TranslatorService,
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly tradesHistoryService: TradesHistoryService,
    private readonly marketService: MarketService,
    private readonly deviceService: DeviceService,
    private readonly chartTemplatesSettingsBrokerService: ChartTemplatesSettingsBrokerService,
    private readonly localStorageService: LocalStorageService,
    @Inject(ACTIONS_CONTEXT)
    private readonly actionsContext: ActionsContext,
    private readonly instrumentSearchService: InstrumentSearchService,
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.initSettingsStream();
    this.initPositionStream();
  }

  ngOnDestroy(): void {
    if (this.chartState) {
      this.clearChartEventsSubscription(this.chartState.widget);
      this.chartState.ordersState?.destroy();
      this.chartState.positionState?.destroy();
      this.chartState.tradesState?.destroy();
      this.intervalChangeSub?.unsubscribe();
      this.timezoneChangeSub?.unsubscribe();
      this.symbolChangeSub?.unsubscribe();
      this.chartState.widget.remove();
    }

    this.techChartDatafeedService.clear();
  }

  ngAfterViewInit(): void {
    // chart should be redrawn only if instrument changed but not chart settings
    const chartSettings$ = this.settings$!.pipe(
      distinctUntilChanged((previous, current) => {
        return (
          previous.widgetSettings.symbol === current.widgetSettings.symbol &&
          previous.widgetSettings.exchange === current.widgetSettings.exchange
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
        return !(prev.widgetSettings.linkToActive ?? false) && (curr?.widgetSettings.linkToActive ?? false) &&
          (chartInstrument?.symbol !== curr?.instrument.symbol || chartInstrument?.exchange !== curr?.instrument.exchange);
      })
    );

    combineLatest(
      {
        settings: chartSettings$,
        theme: this.themeService.getThemeSettings(),
        translator: this.translatorService.getTranslator('tech-chart/tech-chart'),
        timezoneConverter: this.timezoneConverterService.getConverter(),
        linkToActiveChange: linkToActiveChange$,
        exchanges: this.marketService.getAllExchanges(),
        deviceInfo: this.deviceService.deviceInfo$
      }).pipe(
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
        x.exchanges,
        x.deviceInfo,
        (this.lastTheme != null && this.lastTheme.theme !== x.theme.theme)
        || this.lastLang !== this.translatorService.getActiveLang()
        || this.lastTimezone !== x.timezoneConverter.displayTimezone,
      );

      this.lastTheme = x.theme;
      this.lastLang = this.translatorService.getActiveLang();
      this.lastTimezone = x.timezoneConverter.displayTimezone;
    });
  }

  private initSettingsStream(): void {
    const getInstrumentInfo = (settings: TechChartSettings): Observable<Instrument> =>
      (SyntheticInstrumentsHelper.isSyntheticInstrument(settings.symbol)
          ? this.syntheticInstrumentsService.getInstrument((<SyntheticInstrumentKey>SyntheticInstrumentsHelper.getRegularOrSyntheticInstrumentKey(settings.symbol)).parts)
          : this.instrumentsService.getInstrument(settings as InstrumentKey)
      ).pipe(
        filter((x): x is Instrument => !!x)
      );

    this.settings$ = this.settingsService.getSettings<TechChartSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => this.isEqualTechChartSettings(previous, current)),
      mapWith(
        settings => getInstrumentInfo(settings),
        (widgetSettings, instrument: Instrument) => ({ widgetSettings, instrument } as ExtendedSettings)
      ),
      shareReplay(1)
    );
  }

  private isEqualTechChartSettings(
    settings1?: TechChartSettings,
    settings2?: TechChartSettings
  ): boolean {
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

  private initPositionStream(): void {
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
    exchanges: MarketExchange[],
    deviceInfo: DeviceInfo,
    forceRecreate = false): void {
    if (this.chartState) {
      if (forceRecreate) {
        this.intervalChangeSub?.unsubscribe();
        this.symbolChangeSub?.unsubscribe();
        this.chartState.widget.remove();
      }
      else {
        this.chartState.widget.activeChart().setSymbol(
          SyntheticInstrumentsHelper.isSyntheticInstrument(settings.symbol) ? settings.symbol : this.toTvSymbol(settings as InstrumentKey),
          () => {
            this.initPositionDisplay(settings, theme.themeColors);
            this.initOrdersDisplay(settings, theme.themeColors);
            this.initTradesDisplay(settings, theme.themeColors, exchanges);
            this.initTimezoneChangeStream(settings, theme.themeColors, exchanges);
          }
        );

        return;
      }
    }

    if (!this.chartContainer) {
      return;
    }

    const currentTimezone = timezoneConverter.getTimezone();

    let chartLayout: any;
    const selectedInstrumentSymbol = SyntheticInstrumentsHelper.isSyntheticInstrument(settings.symbol) ? settings.symbol : this.toTvSymbol(settings as InstrumentKey);

    if (settings.chartLayout) {
      chartLayout = JSON.parse(JSON.stringify(settings.chartLayout)) as object;
      if (chartLayout?.charts?.[0]?.panes?.[0]?.sources?.[0]?.state) {
        chartLayout.charts[0].panes[0].sources[0].state.symbol = selectedInstrumentSymbol;
        chartLayout.charts[0].panes[0].sources[0].state.shortName = selectedInstrumentSymbol;
      }
    }

    this.localStorageService.removeItem('tradingview.current_theme.name');

    const features = this.getFeatures(settings);

    this.techChartDatafeedService.setExchangeSettings(exchanges);
    const config: ChartingLibraryWidgetOptions = {
      // debug
      debug: false,
      // base options
      container: this.chartContainer.nativeElement,
      symbol: selectedInstrumentSymbol,
      interval: (chartLayout?.charts?.[0]?.panes?.[0]?.sources?.[0]?.state?.interval ?? '1D') as ResolutionString,
      locale: this.translatorService.getActiveLang() as LanguageCode,
      library_path: '/assets/charting_library/',
      datafeed: this.techChartDatafeedService,
      // additional options
      fullscreen: false,
      autosize: true,
      timezone: currentTimezone.name as Timezone,
      custom_timezones: [
        {
          id: currentTimezone.name as CustomTimezoneId,
          alias: `Etc/GMT${currentTimezone.utcOffset > 0 ? '+' : '-'}${currentTimezone.formattedOffset}` as GmtTimezoneId,
          title: currentTimezone.name
        }
      ],
      theme: theme.theme === ThemeType.default ? 'light' : 'dark',
      saved_data: chartLayout as object,
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
      // for some reasons TV stringifies this field. So service cannot be passed directly
      save_load_adapter: this.createSaveLoadAdapter(),
      //features
      disabled_features: features.disabled,
      enabled_features: features.enabled
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
          this.initTradesDisplay(settings, theme.themeColors, exchanges);
          this.initTimezoneChangeStream(settings, theme.themeColors, exchanges);
        }
      );

      if (!deviceInfo.isMobile && (settings.panels?.headerSymbolSearch ?? true)) {
        chartWidget.headerReady().then(() => SearchButtonHelper.create(
          this.chartState!.widget,
          this.instrumentSearchService,
          this.settings$.pipe(
            map(s => s.instrument),
            distinctUntilChanged((prev, curr) => isInstrumentEqual(prev, curr)),
            takeUntilDestroyed(this.destroyRef)
          ),
          theme.theme,
          this.destroyRef
        ));

        this.initSearchShortcuts();
      }

      this.intervalChangeSub = new Subscription();
      this.symbolChangeSub = new Subscription();

      this.chartState!.widget.activeChart().onIntervalChanged()
        .subscribe(null, this.intervalChangeCallback);
      this.intervalChangeSub.add(() => this.chartState?.widget!.activeChart().onIntervalChanged().unsubscribe(null, this.intervalChangeCallback));

      this.chartState!.widget.activeChart().onSymbolChanged()
        .subscribe(null, this.symbolChangeCallback);
      this.symbolChangeSub.add(() => this.chartState?.widget!.activeChart().onSymbolChanged().unsubscribe(null, this.symbolChangeCallback));
    });
  }

  private initSearchShortcuts(): void {
    this.chartState!.widget.onShortcut("ctrl+f", () => {
      this.instrumentSearchService.openModal({ value: this.chartState!.widget.activeChart().symbol() ?? null });
    });

    const validKeyCodeRegExp = new RegExp('^Key[A-Z]$');

    fromEvent<MouseEvent>(this.chartContainer!.nativeElement, 'mouseenter')
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.isChartFocused = true);

    fromEvent<MouseEvent>(this.chartContainer!.nativeElement, 'mouseleave')
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.isChartFocused = false);

    fromEvent<KeyboardEvent>(this.document.body, 'keydown')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((e) =>
          this.isChartFocused &&
          !e.ctrlKey &&
          !e.shiftKey &&
          !e.metaKey &&
          !e.altKey &&
          validKeyCodeRegExp.test(e.code)
        ),
        withLatestFrom(this.instrumentSearchService.isModalOpened$
          .pipe(
            filter(isOpened => !isOpened)
          ))
      )
      .subscribe(([key]) => {
        this.instrumentSearchService.openModal({ value: key.key, needTextSelection: false });
      });
  }

  private readonly intervalChangeCallback: (interval: ResolutionString, timeFrameParameters: { timeframe?: TimeFrameValue }) => void =
    (interval, timeframeObj) => {
      if (interval.includes('S')) {
        timeframeObj.timeframe = {
          from: Math.round(addSeconds(new Date(), +interval.slice(0, -1) * -100).getTime() / 1000),
          to: Math.round(new Date().getTime() / 1000),
          type: TimeFrameType.TimeRange
        };
      }
    };

  private readonly symbolChangeCallback = (): void => {
    this.settings$!.pipe(
      take(1),
      filter((s: ExtendedSettings) => {
        const settingsTicker = SyntheticInstrumentsHelper.isSyntheticInstrument(s.instrument.symbol)
          ? s.instrument.symbol
          : this.toTvSymbol(s.instrument);

        return settingsTicker !== this.chartState!.widget.activeChart().symbol();
      })
    )
      .subscribe(settings => {
        const chartSymbol = this.chartState!.widget.activeChart().symbol();

        if(SyntheticInstrumentsHelper.isSyntheticInstrument(chartSymbol)) {
          this.settingsService.updateSettings(
            this.guid,
            {
              linkToActive: false,
              symbol: chartSymbol
            });
        } else {
          const instrumentKey = toInstrumentKey((<RegularInstrumentKey>SyntheticInstrumentsHelper.getRegularOrSyntheticInstrumentKey(chartSymbol)).instrument);

          if (settings.widgetSettings.linkToActive ?? false) {
            this.actionsContext.instrumentSelected(instrumentKey, settings.widgetSettings.badgeColor ?? defaultBadgeColor);
            return;
          }

          this.settingsService.updateSettings(
            settings.widgetSettings.guid,
            {
              ...instrumentKey
            }
          );
        }
      });
  };

  private toTvSymbol(instrumentKey: InstrumentKey): string {
    return `[${instrumentKey.exchange}:${instrumentKey.symbol}:${instrumentKey.instrumentGroup ?? ''}]`;
  }

  private subscribeToChartEvents(widget: IChartingLibraryWidget): void {
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

  private saveChartLayout(widget: IChartingLibraryWidget): void {
    widget.save(state => {
      this.settingsService.updateSettings<TechChartSettings>(
        this.guid,
        {
          chartLayout: state
        }
      );
    });
  }

  private subscribeToChartEvent(target: IChartingLibraryWidget, event: (keyof SubscribeEventsMap), callback: SubscribeEventsMap[keyof SubscribeEventsMap]): void {
    this.chartEventSubscriptions.push({ event: event, callback });
    target.subscribe(event, callback);
  }

  private clearChartEventsSubscription(target: IChartingLibraryWidget): void {
    this.chartEventSubscriptions.forEach(subscription => target.unsubscribe(subscription.event, subscription.callback));
    this.chartEventSubscriptions = [];
  }

  private selectPrice(price: number): void {
    if (!this.chartState?.widget || SyntheticInstrumentsHelper.isSyntheticInstrument(this.chartState.widget.activeChart().symbol())) {
      return;
    }

    combineLatest({
      settings: this.settings$,
      allSettings: this.settingsService.getAllSettings(),
      currentDashboard: this.currentDashboardService.selectedDashboard$
    }).pipe(
      take(1)
    ).subscribe(x => {
      const relatedWidgets = x.currentDashboard.items
        .filter(i => i.widgetType === 'order-submit')
        .map(i => i.guid);

      const relatedSettings = x.allSettings.filter(s => relatedWidgets.includes(s.guid) && s.badgeColor === x.settings.widgetSettings.badgeColor);

      const roundedPrice = MathHelper.roundByMinStepMultiplicity(price, x.settings.instrument.minstep);

      if (relatedSettings.length === 0 || x.settings.widgetSettings.badgeColor == null || !x.settings.widgetSettings.badgeColor.length) {
        this.ordersDialogService.openNewOrderDialog({
          instrumentKey: toInstrumentKey(x.settings.widgetSettings as InstrumentKey),
          initialValues: {
            orderType: OrderFormType.Limit,
            price: roundedPrice,
            quantity: 1
          }
        });
      }
      else {
        this.widgetsSharedDataService.setDataProviderValue<SelectedPriceData>(this.selectedPriceProviderName, {
          price: roundedPrice,
          badgeColor: x.settings.widgetSettings.badgeColor!
        });
      }
    });
  }

  private getCurrentPortfolio(): Observable<PortfolioKey> {
    return this.currentDashboardService.selectedPortfolio$;
  }

  private initPositionDisplay(settings: TechChartSettings, themeColors: ThemeColors): void {
    this.chartState!.positionState?.destroy();
    if(!(settings.showPosition ?? true)) {
      return;
    }

    const tearDown = new Subscription();
    this.chartState!.positionState = new PositionState(tearDown);

    const subscription = this.allActivePositions$!.pipe(
      map(x => x.find(p => p.symbol === settings.symbol && p.exchange === settings.exchange)),
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
        .setBodyTextColor(themeColors.chartPrimaryTextColor)
        .setLineLength(this.getMarkerLineLengthPercent(settings.positionLineMarkerPosition), "percentage");
    });

    tearDown.add(subscription);
  }

  private getMarkerLineLengthPercent(position: LineMarkerPosition | undefined): number {
    switch (position) {
      case LineMarkerPosition.Left:
        return 90;
      case LineMarkerPosition.Middle:
        return 40;
      default:
        return 10;
    }
  }

  private initOrdersDisplay(settings: TechChartSettings, themeColors: ThemeColors): void {
    this.chartState!.ordersState?.destroy();
    if(!(settings.showOrders ?? true)) {
      return;
    }

    const tearDown = new Subscription();
    this.chartState!.ordersState = new OrdersState(tearDown);

    tearDown.add(this.setupOrdersUpdate(
      this.getLimitOrdersStream(settings as InstrumentKey),
      this.chartState!.ordersState.limitOrders,
      (order, orderLineAdapter) => {
        this.fillOrderBaseParameters(order, orderLineAdapter, themeColors, settings.ordersLineMarkerPosition ?? LineMarkerPosition.Right);
        this.fillLimitOrder(order, orderLineAdapter);
      }
    ));

    tearDown.add(this.setupOrdersUpdate(
      this.getStopOrdersStream(settings as InstrumentKey),
      this.chartState!.ordersState.stopOrders,
      (order, orderLineAdapter) => {
        this.fillOrderBaseParameters(order, orderLineAdapter, themeColors, settings.ordersLineMarkerPosition ?? LineMarkerPosition.Right);
        this.fillStopOrder(order, orderLineAdapter);
      }
    ));
  }

  private initTimezoneChangeStream(settings: TechChartSettings, themeColors: ThemeColors, exchanges: MarketExchange[]): void {
    this.timezoneChangeSub?.unsubscribe();
    this.timezoneChangeSub = new Subscription();

    const timezoneChangeCallback = (): void => this.initTradesDisplay(settings, themeColors, exchanges);
    this.chartState?.widget.activeChart().getTimezoneApi().onTimezoneChanged().subscribe(null, timezoneChangeCallback);
    this.timezoneChangeSub.add(() => this.chartState?.widget.activeChart().getTimezoneApi().onTimezoneChanged().unsubscribe(null, timezoneChangeCallback));
  }

  private initTradesDisplay(settings: TechChartSettings, themeColors: ThemeColors, exchanges: MarketExchange[]): void {
    if(!(settings.showTrades ?? false)) {
      return;
    }

    this.chartState!.tradesState?.destroy();

    const tearDown = new Subscription();
    this.chartState!.tradesState = new TradesState(tearDown, settings as InstrumentKey);

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
          this.drawTrade(trade, themeColors, exchanges);
        });
      })
    );

    //setup history trades
    const visibleRangeChange$ = new Subject();
    const checkHistoryCallback = (): void => visibleRangeChange$.next({});

    this.chartState?.widget.activeChart().onVisibleRangeChanged().subscribe(null, checkHistoryCallback);
    tearDown.add(() => visibleRangeChange$.complete());
    tearDown.add(() => this.chartState?.widget.activeChart().onVisibleRangeChanged().unsubscribe(null, checkHistoryCallback));

    visibleRangeChange$.pipe(
      debounceTime(500),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.fillTradesHistoryCurrentRange(settings as InstrumentKey, currentPortfolio$, themeColors, exchanges);
    });

    this.fillTradesHistoryCurrentRange(settings as InstrumentKey, currentPortfolio$, themeColors, exchanges);
  }

  private drawTrade(trade: Trade, themeColors: ThemeColors, exchanges: MarketExchange[]): void {
    if(!this.chartState?.tradesState) {
      return;
    }

    if(this.chartState.tradesState.instrument.exchange !== trade.exchange
      || this.chartState.tradesState.instrument.symbol !== trade.symbol) {
      return;
    }

    if(!(this.chartState.tradesState.isTradeDrawn(trade))) {

      const currentVisibleRange = this.chartState.widget.activeChart().getVisibleRange();
      const tradeTime = Math.round(trade.date.getTime() / 1000);

      if(tradeTime < currentVisibleRange.from || tradeTime > currentVisibleRange.to) {
        return;
      }

      let chartSelectedTimezone: string | undefined = (this.chartState.widget.activeChart().getTimezoneApi().getTimezone() as TimezoneInfo | undefined)?.id;
      if ((chartSelectedTimezone ?? 'exchange') === 'exchange') {
        const exchange = exchanges.find(x => x.exchange === trade.exchange);
        chartSelectedTimezone = exchange?.settings.timezone;
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
    themeColors: ThemeColors,
    exchanges: MarketExchange[]
  ): void {
    const visibleRange = this.chartState?.widget.activeChart().getVisibleRange();
    if(!visibleRange) {
      return;
    }

    let startTradeId: string | null = null;
    const drawTrades = (): void => {
      this.chartState?.tradesState?.getTradesForRange(visibleRange.from, visibleRange.to).forEach(t => {
        this.drawTrade(t, themeColors, exchanges);
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

        this.fillTradesHistoryCurrentRange(instrument, portfolioKey$, themeColors, exchanges);
      }
    });
  }

  private setupOrdersUpdate<T extends Order>(
    data$: Observable<T[]>,
    state: Map<string, IOrderLineAdapter>,
    fillOrderLine: (order: T, orderLineAdapter: IOrderLineAdapter) => void): Subscription {
    const removeItem = (itemKey: string): void => {
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
      map(orders => orders.allOrders.filter(o => o.type === OrderType.Limit)),
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

  private fillOrderBaseParameters(order: Order, orderLineAdapter: IOrderLineAdapter, themeColors: ThemeColors, position: LineMarkerPosition): void {
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
      .setBodyTextColor(order.side === Side.Buy ? themeColors.buyColor : themeColors.sellColor)
      .setLineLength(this.getMarkerLineLengthPercent(position), "percentage")
    ;
  }

  private fillLimitOrder(order: Order, orderLineAdapter: IOrderLineAdapter): void {
    const getEditCommand = (): EditOrderDialogParams => ({
      orderId: order.id,
      orderType: OrderFormType.Limit,
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
      .onCancel(() => this.wsOrdersService.cancelOrders([{
          orderId: order.id,
          portfolio: order.portfolio,
          exchange: order.exchange,
          orderType: order.type
        }]).subscribe()
      )
      .onModify(() => this.ordersDialogService.openEditOrderDialog(getEditCommand()))
      .onMove(() => {
          const params = {
            ...getEditCommand(),
            cancelCallback: (): IOrderLineAdapter => orderLineAdapter.setPrice(order.price)
          };

          params.initialValues = {
            ...params.initialValues,
            price: orderLineAdapter.getPrice(),
            hasPriceChanged: orderLineAdapter.getPrice() !== order.price
          };
          this.ordersDialogService.openEditOrderDialog(params);
        }
      );
  }

  private fillStopOrder(order: StopOrder, orderLineAdapter: IOrderLineAdapter): void {
    const conditionType: LessMore = getConditionTypeByString(order.conditionType)!;
    const orderText = 'S'
      + (order.type === OrderType.StopLimit ? 'L' : 'M')
      + ' '
      + (getConditionSign(conditionType) as string);

    const orderTooltip = this.translateFn([order.side === Side.Buy ? 'buy' : 'sell'])
      + ' '
      + this.translateFn([order.type === OrderType.StopLimit ? 'stopLimit' : 'stopMarket'])
      + ' ('
      + this.translateFn([(conditionType as LessMore | null) ?? ''])
      + ')';

    const getEditCommand = (): EditOrderDialogParams => ({
      orderId: order.id,
      orderType: OrderFormType.Stop,
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
      .onCancel(() => this.wsOrdersService.cancelOrders([{
          orderId: order.id,
          portfolio: order.portfolio,
          exchange: order.exchange,
          orderType: order.type
        }]).subscribe()
      )
      .onModify(() => this.ordersDialogService.openEditOrderDialog(getEditCommand()))
      .onMove(() => {
        const params = {
          ...getEditCommand(),
          cancelCallback: (): IOrderLineAdapter => orderLineAdapter.setPrice(order.triggerPrice)
        };

        params.initialValues = {
          ...params.initialValues,
          price: orderLineAdapter.getPrice(),
          hasPriceChanged: orderLineAdapter.getPrice() !== order.price
        };
        this.ordersDialogService.openEditOrderDialog(params);
      }
    );
  }

  private createSaveLoadAdapter(): IExternalSaveLoadAdapter {
    const service = this.chartTemplatesSettingsBrokerService;
    return {
      getAllChartTemplates(): Promise<string[]> {
        return firstValueFrom(service.getSavedTemplates().pipe(
            map(t => t.map(x => x.templateName))
          )
        );
      },

      getChartTemplateContent(templateName: string): Promise<ChartTemplate> {
        return firstValueFrom(service.getSavedTemplates().pipe(
            map(t => ({
              content: t.find(x => x.templateName === templateName)?.content
            }))
          )
        );
      },

      saveChartTemplate(newName: string, theme: ChartTemplateContent): Promise<void> {
        return firstValueFrom(service.saveChartTemplate(newName, theme));
      },

      removeChartTemplate(templateName: string): Promise<void> {
        return firstValueFrom(service.removeTemplate(templateName));
      },

      saveChart(): Promise<string> {
        return Promise.resolve('');
      },

      getAllCharts(): Promise<ChartMetaInfo[]> {
        return Promise.resolve([]);
      },

      getChartContent(): Promise<string> {
        return Promise.resolve('');
      },

      removeChart(): Promise<void> {
        return Promise.resolve();
      },

      getAllStudyTemplates(): Promise<StudyTemplateMetaInfo[]> {
        return Promise.resolve([]);
      },

      loadDrawingTemplate(): Promise<string> {
        return Promise.resolve('');
      },

      getDrawingTemplates(): Promise<string[]> {
        return Promise.resolve([]);
      },

      loadLineToolsAndGroups(): Promise<Partial<LineToolsAndGroupsState> | null> {
        return Promise.resolve(null);
      },

      removeDrawingTemplate(): Promise<void> {
        return Promise.resolve();
      },

      saveDrawingTemplate(): Promise<void> {
        return Promise.resolve();
      },

      saveLineToolsAndGroups(): Promise<void> {
        return Promise.resolve();
      },

      saveStudyTemplate(): Promise<void> {
        return Promise.resolve();
      },

      removeStudyTemplate(): Promise<void> {
        return Promise.resolve();
      },

      getStudyTemplateContent(): Promise<string> {
        return Promise.resolve('');
      }
    };
  }

  private getFeatures(settings: TechChartSettings): { enabled: ChartingLibraryFeatureset[], disabled: ChartingLibraryFeatureset[] } {
    const enabled = new Set<ChartingLibraryFeatureset>([
      'side_toolbar_in_fullscreen_mode',
      'chart_crosshair_menu' as ChartingLibraryFeatureset,
      'seconds_resolution',
      'chart_template_storage'
    ]);

    const disabled = new Set<ChartingLibraryFeatureset>(
      [
        'symbol_info',
        'display_market_status',
        'save_shortcut',
        'header_quick_search',
        'header_saveload',
        'header_symbol_search',
        'symbol_search_hot_key'
      ]
    );

    this.switchChartFeature('header_widget', settings.panels?.header ?? true, enabled, disabled);
    this.switchChartFeature('header_chart_type', settings.panels?.headerChartType ?? true, enabled, disabled);
    this.switchChartFeature('header_compare', settings.panels?.headerCompare ?? true, enabled, disabled);
    this.switchChartFeature('header_resolutions', settings.panels?.headerResolutions ?? true, enabled, disabled);
    this.switchChartFeature('header_indicators', settings.panels?.headerIndicators ?? true, enabled, disabled);
    this.switchChartFeature('header_screenshot', settings.panels?.headerScreenshot ?? true, enabled, disabled);
    this.switchChartFeature('header_settings', settings.panels?.headerSettings ?? true, enabled, disabled);
    this.switchChartFeature('header_undo_redo', settings.panels?.headerUndoRedo ?? true, enabled, disabled);
    this.switchChartFeature('header_fullscreen_button', settings.panels?.headerFullscreenButton ?? true, enabled, disabled);
    this.switchChartFeature('left_toolbar', settings.panels?.drawingsToolbar ?? true, enabled, disabled);
    this.switchChartFeature('timeframes_toolbar', settings.panels?.timeframesBottomToolbar ?? true, enabled, disabled);

    return {
      enabled: [...enabled.values()],
      disabled: [...disabled.values()],
    };
  }

  private switchChartFeature(
    feature: ChartingLibraryFeatureset,
    enabled: boolean,
    enabledSet: Set<ChartingLibraryFeatureset>,
    disabledSet: Set<ChartingLibraryFeatureset>): void {
    if(enabled) {
      enabledSet.add(feature);
    } else {
      disabledSet.add(feature);
    }
  }
}
