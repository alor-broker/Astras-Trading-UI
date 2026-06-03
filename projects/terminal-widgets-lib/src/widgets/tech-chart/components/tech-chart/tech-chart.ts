import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {Location} from '@angular/common';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  fromEvent,
  merge,
  Observable,
  pairwise,
  shareReplay,
  Subscription,
  take,
  withLatestFrom
} from 'rxjs';
import {TechChartDatafeedService} from '../../services/tech-chart-datafeed.service';
import {
  map,
  startWith
} from 'rxjs/operators';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {SyntheticInstrumentsHelper} from "../../utils/synthetic-instruments.helper";
import {SyntheticInstrumentsService} from "../../services/synthetic-instruments.service";
import {ChartTemplatesSettingsBrokerService} from "../../services/chart-templates-settings-broker.service";
import {InstrumentSearchService} from "../../services/instrument-search.service";
import {SearchButtonHelper} from "../../utils/search-button.helper";

import {TradesDisplayExtension} from "../../extensions/trades-display.extension";
import {ChartContext} from "../../extensions/base.extension";
import {PositionDisplayExtension} from "../../extensions/position-display.extension";
import {OrdersDisplayExtension} from "../../extensions/orders-display.extension";
import {FuturesInstrumentHelper} from "../../utils/futures-instrument.helper";
import {
  Instrument,
  InstrumentKey
} from "@terminal-core-lib/common/types/instrument.types";
import {TechChartWidgetSettings} from "../../widget-settings.types";
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
  LanguageCode,
  LineToolsAndGroupsState,
  PlusClickParams,
  ResolutionString,
  StudyTemplateMetaInfo,
  SubscribeEventsMap,
  TimeFrameType,
  TimeFrameValue,
  Timezone,
  widget
} from "@terminal-widgets-lib/assets/charting_library";
import {WidgetSettingsService} from "@terminal-core-lib/features/widget-settings/services/widget-settings.service";
import {ThemeService} from "@terminal-core-lib/features/themes/services/theme.service";
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {EventsBusService} from '@terminal-core-lib/common/services/events-bus.service';
import {InstrumentsService} from "@terminal-core-lib/features/instruments/services/instruments.service";
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {TimezoneConverterService} from "@terminal-core-lib/features/timezones/services/timezone-converter.service";
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {MarketService} from "@terminal-core-lib/features/market-config/market.service";
import {DeviceService} from "@terminal-core-lib/common/services/device.service";
import {LocalStorageService} from "@terminal-core-lib/features/local-storage/local-storage.service";
import {
  ACTIONS_CONTEXT,
  ActionsContext
} from "@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types";
import {
  ThemeSettings,
  ThemeType
} from "@terminal-core-lib/features/themes/themes.types";
import {TimezoneDisplayOption} from "@terminal-core-lib/features/terminal-settings/terminal-settings.types";
import {HashMap} from "@jsverse/transloco/lib/utils/type.utils";
import {
  RegularInstrumentKey,
  SyntheticInstrumentKey
} from "../../types/synthetic-instruments.model";
import {mapWith} from "@terminal-core-lib/common/utils/observable/map-with";
import {MarketExchange} from "@terminal-core-lib/features/market-config/market-config.types";
import {TimezoneConverter} from "@terminal-core-lib/features/timezones/utils/timezone-converter";
import {DeviceInfo} from "@terminal-core-lib/common/services/device-service-types";
import {
  InstrumentEqualityComparer,
  InstrumentKeyHelper
} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {
  addSeconds,
  getUnixTime
} from "date-fns";
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {OrderFormType} from '@terminal-core-lib/features/orders/services/orders-dialog-service.types';
import {
  SelectedPriceData,
  SelectedPriceEventKey
} from '@terminal-core-lib/features/orders/types/selected-price-event.types';
import {InstrumentSearchModal} from '@terminal-widgets-lib/widgets/tech-chart/components/instrument-search-modal/instrument-search-modal';

interface ExtendedSettings {
  widgetSettings: TechChartWidgetSettings;
  instrument: Instrument;
}

interface ChartState {
  widget: IChartingLibraryWidget;
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};

type FeatureToggleWidget = IChartingLibraryWidget & {
  setFeatureEnabled?: (feature: ChartingLibraryFeatureset, enabled: boolean) => void;
};

@Component({
  selector: 'ats-tech-chart',
  templateUrl: './tech-chart.html',
  styleUrls: ['./tech-chart.less'],
  imports: [
    InstrumentSearchModal
  ],
  providers: [
    TechChartDatafeedService,
    PositionDisplayExtension,
    OrdersDisplayExtension,
    TradesDisplayExtension,
    InstrumentSearchService,
    SyntheticInstrumentsService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TechChart implements OnInit, OnDestroy, AfterViewInit {
  readonly guid = input.required<string>();

  readonly chartContainer = viewChild<ElementRef<HTMLElement>>('chartContainer');

  private readonly settingsService = inject(WidgetSettingsService);

  private readonly techChartDatafeedService = inject(TechChartDatafeedService);

  private readonly themeService = inject(ThemeService);

  private readonly instrumentsService = inject(InstrumentsService);

  private readonly syntheticInstrumentsService = inject(SyntheticInstrumentsService);

  private readonly eventsBusService = inject(EventsBusService);

  private readonly ordersDialogService = inject(OrdersDialogService);

  private readonly currentDashboardService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly translatorService = inject(TranslatorService);

  private readonly timezoneConverterService = inject(TimezoneConverterService);

  private readonly marketService = inject(MarketService);

  private readonly deviceService = inject(DeviceService);

  private readonly chartTemplatesSettingsBrokerService = inject(ChartTemplatesSettingsBrokerService);

  private readonly localStorageService = inject(LocalStorageService);

  private readonly tradesDisplayExtension = inject(TradesDisplayExtension);

  private readonly positionDisplayExtension = inject(PositionDisplayExtension);

  private readonly ordersDisplayExtension = inject(OrdersDisplayExtension);

  private readonly actionsContext = inject<ActionsContext>(ACTIONS_CONTEXT);

  private readonly instrumentSearchService = inject(InstrumentSearchService);

  private readonly document = inject<Document>(DOCUMENT);

  private readonly location = inject(Location);

  private readonly destroyRef = inject(DestroyRef);

  private chartState?: ChartState;

  private settings$!: Observable<ExtendedSettings>;

  private chartEventSubscriptions: {
    event: (keyof SubscribeEventsMap);
    callback: SubscribeEventsMap[keyof SubscribeEventsMap];
  }[] = [];

  private lastTheme?: ThemeSettings;

  private lastLang?: string;

  private lastTimezone?: TimezoneDisplayOption;

  private translateFn!: (key: string[], params?: HashMap) => string;

  private intervalChangeSub?: Subscription;

  private symbolChangeSub?: Subscription;

  private fullscreenChangeSub?: Subscription;

  private isChartFocused = false;

  ngOnInit(): void {
    this.initSettingsStream();
  }

  ngOnDestroy(): void {
    if (this.chartState) {
      try {
        this.clearChartEventsSubscription(this.chartState.widget);
        this.intervalChangeSub?.unsubscribe();
        this.symbolChangeSub?.unsubscribe();
        this.fullscreenChangeSub?.unsubscribe();
        this.ordersDisplayExtension.destroyState();
        this.positionDisplayExtension.destroyState();
        this.tradesDisplayExtension.destroyState();
        this.chartState.widget.remove();
      } catch {
        // Ignore cleanup errors from the embedded chart widget.
      }
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
    const getInstrumentInfo = (settings: TechChartWidgetSettings): Observable<Instrument> =>
      (SyntheticInstrumentsHelper.isSyntheticInstrument(settings.symbol)
          ? this.syntheticInstrumentsService.getInstrument((<SyntheticInstrumentKey>SyntheticInstrumentsHelper.getRegularOrSyntheticInstrumentKey(settings.symbol)).parts)
          : this.instrumentsService.getInstrument(settings as InstrumentKey)
      ).pipe(
        filter((x): x is Instrument => !!x)
      );

    this.settings$ = this.settingsService.getSettings<TechChartWidgetSettings>(this.guid()).pipe(
      distinctUntilChanged((previous, current) => this.isEqualTechChartSettings(previous, current)),
      mapWith(
        settings => getInstrumentInfo(settings),
        (widgetSettings, instrument: Instrument) => ({widgetSettings, instrument} as ExtendedSettings)
      ),
      shareReplay(1)
    );
  }

  private isEqualTechChartSettings(
    settings1?: TechChartWidgetSettings,
    settings2?: TechChartWidgetSettings
  ): boolean {
    if (settings1 && settings2) {
      return (
        settings1.linkToActive == settings2.linkToActive &&
        settings1.guid == settings2.guid &&
        settings1.symbol == settings2.symbol &&
        settings1.exchange == settings2.exchange &&
        settings1.chartLayout == settings2.chartLayout &&
        settings1.badgeColor == settings2.badgeColor
      );
    } else return false;
  }

  private createChart(
    settings: TechChartWidgetSettings,
    theme: ThemeSettings,
    timezoneConverter: TimezoneConverter,
    exchanges: MarketExchange[],
    deviceInfo: DeviceInfo,
    forceRecreate = false): void {
    if (this.chartState) {
      if (forceRecreate) {
        this.intervalChangeSub?.unsubscribe();
        this.symbolChangeSub?.unsubscribe();
        this.fullscreenChangeSub?.unsubscribe();
        this.chartState.widget.remove();
      } else {
        this.chartState.widget.activeChart().setSymbol(
          SyntheticInstrumentsHelper.isSyntheticInstrument(settings.symbol) ? settings.symbol : this.toTvSymbol(settings as InstrumentKey),
          () => {
            const extensionsContext = this.createExtensionContext(settings, theme);
            this.positionDisplayExtension.update(extensionsContext);
            this.ordersDisplayExtension.update(extensionsContext);
            this.tradesDisplayExtension.update(extensionsContext);
          }
        );

        return;
      }
    }

    const chartContainer = this.chartContainer();
    if (!chartContainer) {
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

    const features = this.getFeatures(settings, deviceInfo);

    this.techChartDatafeedService.setExchangeSettings(exchanges);
    const config: ChartingLibraryWidgetOptions = {
      // debug
      debug: false,
      // base options
      container: chartContainer.nativeElement,
      symbol: selectedInstrumentSymbol,
      interval: (chartLayout?.charts?.[0]?.panes?.[0]?.sources?.[0]?.state?.interval ?? '1D') as ResolutionString,
      locale: this.translatorService.getActiveLang() as LanguageCode,
      library_path: this.location.prepareExternalUrl('/assets/charting_library/'),
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
        {
          text: '1000y',
          resolution: '1M' as ResolutionString,
          description: this.translateFn(['timeframes', 'all', 'desc']),
          title: this.translateFn(['timeframes', 'all', 'title'])
        },
        {
          text: '3y',
          resolution: '1M' as ResolutionString,
          description: this.translateFn(['timeframes', '3y', 'desc']),
          title: this.translateFn(['timeframes', '3y', 'title'])
        },
        {
          text: '1y',
          resolution: '1D' as ResolutionString,
          description: this.translateFn(['timeframes', '1y', 'desc']),
          title: this.translateFn(['timeframes', '1y', 'title'])
        },
        {
          text: '6m',
          resolution: '1D' as ResolutionString,
          description: this.translateFn(['timeframes', '6m', 'desc']),
          title: this.translateFn(['timeframes', '6m', 'title'])
        },
        {
          text: '3m',
          resolution: '4H' as ResolutionString,
          description: this.translateFn(['timeframes', '3m', 'desc']),
          title: this.translateFn(['timeframes', '3m', 'title'])
        },
        {
          text: '1m',
          resolution: '1H' as ResolutionString,
          description: this.translateFn(['timeframes', '1m', 'desc']),
          title: this.translateFn(['timeframes', '1m', 'title'])
        },
        {
          text: '14d',
          resolution: '1H' as ResolutionString,
          description: this.translateFn(['timeframes', '2w', 'desc']),
          title: this.translateFn(['timeframes', '2w', 'title'])
        },
        {
          text: '7d',
          resolution: '15' as ResolutionString,
          description: this.translateFn(['timeframes', '1w', 'desc']),
          title: this.translateFn(['timeframes', '1w', 'title'])
        },
        {
          text: '1d',
          resolution: '5' as ResolutionString,
          description: this.translateFn(['timeframes', '1d', 'desc']),
          title: this.translateFn(['timeframes', '1d', 'title'])
        },
      ],
      symbol_search_request_delay: 2000,
      // for some reasons TV stringifies this field. So service cannot be passed directly
      save_load_adapter: this.createSaveLoadAdapter(),
      // features
      disabled_features: features.disabled,
      enabled_features: features.enabled
    };

    const chartWidget = new widget(config);
    this.subscribeToChartEvents(chartWidget);

    this.chartState = {
      widget: chartWidget
    };

    chartWidget.onChartReady(() => {
      try {
        this.chartState?.widget!.activeChart().dataReady(() => {
            const extensionsContext = this.createExtensionContext(settings, theme);
            this.positionDisplayExtension.apply(extensionsContext);
            this.ordersDisplayExtension.apply(extensionsContext);
            this.tradesDisplayExtension.apply(extensionsContext);
          }
        );
      } catch {
        // Ignore extension errors from the embedded chart widget.
      }

      if (!deviceInfo.isMobile && (settings.panels?.headerSymbolSearch ?? true)) {
        chartWidget.headerReady().then(() => SearchButtonHelper.create(
          this.chartState!.widget,
          this.instrumentSearchService,
          this.settings$.pipe(
            map(s => s.instrument),
            distinctUntilChanged((prev, curr) => InstrumentEqualityComparer.equals(prev, curr)),
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

      this.initFullscreenCrosshairMenuToggle();
    });
  }

  private initSearchShortcuts(): void {
    this.chartState!.widget.onShortcut("ctrl+f", () => {
      this.instrumentSearchService.openModal({value: this.chartState!.widget.activeChart().symbol() ?? null});
    });

    const validKeyCodeRegExp = new RegExp('^Key[A-Z]$');

    fromEvent<MouseEvent>(this.chartContainer()!.nativeElement, 'mouseenter')
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.isChartFocused = true);

    fromEvent<MouseEvent>(this.chartContainer()!.nativeElement, 'mouseleave')
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
        this.instrumentSearchService.openModal({value: key.key, needTextSelection: false});
      });
  }

  private initFullscreenCrosshairMenuToggle(): void {
    this.fullscreenChangeSub?.unsubscribe();

    const chartFrameDocument = this.chartContainer()?.nativeElement.querySelector('iframe')?.contentDocument ?? null;
    const fullscreenDocuments = [
      this.document,
      chartFrameDocument
    ].filter((fullscreenDocument): fullscreenDocument is Document => fullscreenDocument != null);

    const fullscreenEvents = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];

    this.fullscreenChangeSub = merge(
      ...fullscreenDocuments.flatMap(fullscreenDocument =>
        fullscreenEvents.map(eventName => fromEvent(fullscreenDocument, eventName))
      )
    ).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.syncCrosshairMenuVisibility());

    this.syncCrosshairMenuVisibility();
  }

  private syncCrosshairMenuVisibility(): void {
    const chartWidget = this.chartState?.widget as FeatureToggleWidget | undefined;
    chartWidget?.setFeatureEnabled?.('chart_crosshair_menu' as ChartingLibraryFeatureset, !this.isChartFullscreen());
  }

  private isChartFullscreen(): boolean {
    const chartContainer = this.chartContainer()?.nativeElement;

    if (!chartContainer) {
      return false;
    }

    const chartFrame = chartContainer.querySelector('iframe');
    const chartFrameDocument = chartFrame?.contentDocument ?? null;

    return this.getFullscreenElements(this.document).some(element =>
        element === chartContainer
        || element === chartFrame
        || chartContainer.contains(element)
      )
      || this.getFullscreenElements(chartFrameDocument).length > 0;
  }

  private getFullscreenElements(fullscreenDocument: Document | null): Element[] {
    if (!fullscreenDocument) {
      return [];
    }

    const documentWithFullscreen = fullscreenDocument as FullscreenDocument;
    return [
      documentWithFullscreen.fullscreenElement,
      documentWithFullscreen.webkitFullscreenElement,
      documentWithFullscreen.mozFullScreenElement,
      documentWithFullscreen.msFullscreenElement
    ].filter((element): element is Element => element != null);
  }

  private readonly intervalChangeCallback: (interval: ResolutionString, timeFrameParameters: {
    timeframe?: TimeFrameValue;
  }) => void =
    (interval, timeframeObj) => {
      if (interval.includes('S')) {
        timeframeObj.timeframe = {
          from: getUnixTime(addSeconds(new Date(), +interval.slice(0, -1) * -100)),
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

        if (SyntheticInstrumentsHelper.isSyntheticInstrument(chartSymbol)) {
          this.settingsService.updateSettings<TechChartWidgetSettings>(
            this.guid(),
            {
              linkToActive: false,
              symbol: chartSymbol
            });
        } else {
          const instrumentKey = InstrumentKeyHelper.toInstrumentKey((<RegularInstrumentKey>SyntheticInstrumentsHelper.getRegularOrSyntheticInstrumentKey(chartSymbol)).instrument);
          const isFuturesGluing = FuturesInstrumentHelper.isFuturesGluing(instrumentKey.symbol);

          if (isFuturesGluing) {
            this.settingsService.updateSettings<TechChartWidgetSettings>(
              settings.widgetSettings.guid,
              {
                ...instrumentKey,
                linkToActive: false
              }
            );

            return;
          }

          if (settings.widgetSettings.linkToActive ?? false) {
            this.actionsContext.selectInstrument(instrumentKey, settings.widgetSettings.badgeColor ?? DefaultBadge);
            return;
          }

          this.settingsService.updateSettings<TechChartWidgetSettings>(
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
      this.settingsService.updateSettings<TechChartWidgetSettings>(
        this.guid(),
        {
          chartLayout: state
        }
      );
    });
  }

  private subscribeToChartEvent(target: IChartingLibraryWidget, event: (keyof SubscribeEventsMap), callback: SubscribeEventsMap[keyof SubscribeEventsMap]): void {
    this.chartEventSubscriptions.push({event: event, callback});
    target.subscribe(event, callback);
  }

  private clearChartEventsSubscription(target: IChartingLibraryWidget): void {
    this.chartEventSubscriptions.forEach(subscription => {
      try {
        target.unsubscribe(subscription.event, subscription.callback);
      } catch {
        // Ignore unsubscribe errors from the embedded chart widget.
      }
    });
    this.chartEventSubscriptions = [];
  }

  private selectPrice(price: number): void {
    if (
      !this.chartState?.widget
      || SyntheticInstrumentsHelper.isSyntheticInstrument(this.chartState.widget.activeChart().symbol())
    ) {
      return;
    }

    combineLatest({
      settings: this.settings$,
      allSettings: this.settingsService.getAllSettings(),
      currentDashboard: this.currentDashboardService.selectedDashboard$
    }).pipe(
      take(1)
    ).subscribe(x => {
      if (FuturesInstrumentHelper.isFuturesGluing(InstrumentKeyHelper.toInstrumentKey(x.settings.widgetSettings as InstrumentKey).symbol)) {
        return;
      }

      const roundedPrice = MathHelper.roundByMinStepMultiplicity(price, x.settings.instrument.minstep);
      if (this.ordersDialogService.dialogOptions.isNewOrderDialogSupported) {
        const relatedWidgets = x.currentDashboard.items
          .filter(i => i.widgetType === 'order-submit')
          .map(i => i.guid);

        const relatedSettings = x.allSettings.filter(s => relatedWidgets.includes(s.guid) && s.badgeColor === x.settings.widgetSettings.badgeColor);
        if (
          relatedSettings.length === 0
          || x.settings.widgetSettings.badgeColor == null
          || !x.settings.widgetSettings.badgeColor.length
        ) {
          this.ordersDialogService.openNewOrderDialog({
            instrumentKey: InstrumentKeyHelper.toInstrumentKey(x.settings.widgetSettings as InstrumentKey),
            initialValues: {
              orderType: OrderFormType.Limit,
              price: roundedPrice,
              quantity: 1
            }
          });

          return;
        }
      }

      this.eventsBusService.publish({
        key: SelectedPriceEventKey,
        payload: {
          price: roundedPrice,
          badgeColor: x.settings.widgetSettings.badgeColor!
        } as SelectedPriceData
      });
    });
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

  private getFeatures(settings: TechChartWidgetSettings, deviceInfo: DeviceInfo): {
    enabled: ChartingLibraryFeatureset[];
    disabled: ChartingLibraryFeatureset[];
  } {
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
    this.switchChartFeature(
      'header_fullscreen_button',
      !deviceInfo.isMobile && (settings.panels?.headerFullscreenButton ?? true),
      enabled,
      disabled
    );
    this.switchChartFeature('left_toolbar', settings.panels?.drawingsToolbar ?? true, enabled, disabled);
    this.switchChartFeature('timeframes_toolbar', settings.panels?.timeframesBottomToolbar ?? true, enabled, disabled);
    this.switchChartFeature('custom_resolutions', settings.allowCustomTimeframes ?? false, enabled, disabled);

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
    if (enabled) {
      enabledSet.add(feature);
    } else {
      disabledSet.add(feature);
    }
  }

  private createExtensionContext(
    settings: TechChartWidgetSettings,
    theme: ThemeSettings): ChartContext {
    return {
      settings,
      theme,
      host: this.chartState!.widget
    };
  }
}
