import { AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy, OnInit, DOCUMENT, input, viewChild, inject } from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  fromEvent,
  Observable,
  pairwise,
  shareReplay,
  Subscription,
  take,
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
} from '../../../../../assets/charting_library';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { TechChartDatafeedService } from '../../services/tech-chart-datafeed.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ThemeSettings, ThemeType } from '../../../../shared/models/settings/theme-settings.model';
import { mapWith } from '../../../../shared/utils/observable-helper';
import { SelectedPriceData } from '../../../../shared/models/orders/selected-order-price.model';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { MathHelper } from '../../../../shared/utils/math-helper';
import { map, startWith } from 'rxjs/operators';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { TechChartSettings } from '../../models/tech-chart-settings.model';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TimezoneConverter } from "../../../../shared/utils/timezone-converter";
import { TimezoneDisplayOption } from "../../../../shared/models/enums/timezone-display-option";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { OrdersDialogService } from "../../../../shared/services/orders/orders-dialog.service";
import { defaultBadgeColor, toInstrumentKey } from "../../../../shared/utils/instruments";
import { OrderFormType } from "../../../../shared/models/orders/orders-dialog.model";
import { WidgetsSharedDataService } from "../../../../shared/services/widgets-shared-data.service";
import { addSeconds } from "../../../../shared/utils/datetime";
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
import { InstrumentSearchService } from "../../services/instrument-search.service";
import { isInstrumentEqual } from "../../../../shared/utils/settings-helper";
import { SearchButtonHelper } from "../../utils/search-button.helper";

import { TradesDisplayExtension } from "../../extensions/trades-display.extension";
import { ChartContext } from "../../extensions/base.extension";
import { PositionDisplayExtension } from "../../extensions/position-display.extension";
import { OrdersDisplayExtension } from "../../extensions/orders-display.extension";
import { HashMap } from "node_modules/@jsverse/transloco/lib/utils/type.utils";

interface ExtendedSettings { widgetSettings: TechChartSettings, instrument: Instrument }

interface ChartState {
  widget: IChartingLibraryWidget;
}

@Component({
    selector: 'ats-tech-chart',
    templateUrl: './tech-chart.component.html',
    styleUrls: ['./tech-chart.component.less'],
    providers: [
        TechChartDatafeedService,
        PositionDisplayExtension,
        OrdersDisplayExtension,
        TradesDisplayExtension
    ]
})
export class TechChartComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly settingsService = inject(WidgetSettingsService);
  private readonly techChartDatafeedService = inject(TechChartDatafeedService);
  private readonly themeService = inject(ThemeService);
  private readonly instrumentsService = inject(InstrumentsService);
  private readonly syntheticInstrumentsService = inject(SyntheticInstrumentsService);
  private readonly widgetsSharedDataService = inject(WidgetsSharedDataService);
  private readonly ordersDialogService = inject(OrdersDialogService);
  private readonly currentDashboardService = inject(DashboardContextService);
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
  private readonly destroyRef = inject(DestroyRef);

  readonly guid = input.required<string>();

  readonly chartContainer = viewChild<ElementRef<HTMLElement>>('chartContainer');

  private readonly selectedPriceProviderName = 'selectedPrice';
  private chartState?: ChartState;
  private settings$!: Observable<ExtendedSettings>;
  private chartEventSubscriptions: { event: (keyof SubscribeEventsMap), callback: SubscribeEventsMap[keyof SubscribeEventsMap] }[] = [];
  private lastTheme?: ThemeSettings;
  private lastLang?: string;
  private lastTimezone?: TimezoneDisplayOption;
  private translateFn!: (key: string[], params?: HashMap) => string;
  private intervalChangeSub?: Subscription;
  private symbolChangeSub?: Subscription;
  private isChartFocused = false;

  ngOnInit(): void {
    this.initSettingsStream();
  }

  ngOnDestroy(): void {
    if (this.chartState) {
      this.clearChartEventsSubscription(this.chartState.widget);
      this.intervalChangeSub?.unsubscribe();
      this.symbolChangeSub?.unsubscribe();
      this.ordersDisplayExtension.destroyState();
      this.positionDisplayExtension.destroyState();
      this.tradesDisplayExtension.destroyState();
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

    this.settings$ = this.settingsService.getSettings<TechChartSettings>(this.guid()).pipe(
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
        settings1.chartLayout == settings2.chartLayout &&
        settings1.badgeColor == settings2.badgeColor
      );
    } else return false;
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

    const features = this.getFeatures(settings);

    this.techChartDatafeedService.setExchangeSettings(exchanges);
    const config: ChartingLibraryWidgetOptions = {
      // debug
      debug: false,
      // base options
      container: chartContainer.nativeElement,
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
      this.chartState?.widget!.activeChart().dataReady(() => {
          const extensionsContext = this.createExtensionContext(settings, theme);
          this.positionDisplayExtension.apply(extensionsContext);
          this.ordersDisplayExtension.apply(extensionsContext);
          this.tradesDisplayExtension.apply(extensionsContext);
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
          this.settingsService.updateSettings<TechChartSettings>(
            this.guid(),
            {
              linkToActive: false,
              symbol: chartSymbol
            });
        } else {
          const instrumentKey = toInstrumentKey((<RegularInstrumentKey>SyntheticInstrumentsHelper.getRegularOrSyntheticInstrumentKey(chartSymbol)).instrument);

          if (settings.widgetSettings.linkToActive ?? false) {
            this.actionsContext.selectInstrument(instrumentKey, settings.widgetSettings.badgeColor ?? defaultBadgeColor);
            return;
          }

          this.settingsService.updateSettings<TechChartSettings>(
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
        this.guid(),
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
      const roundedPrice = MathHelper.roundByMinStepMultiplicity(price, x.settings.instrument.minstep);
      if(this.ordersDialogService.dialogOptions.isNewOrderDialogSupported) {
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
            instrumentKey: toInstrumentKey(x.settings.widgetSettings as InstrumentKey),
            initialValues: {
              orderType: OrderFormType.Limit,
              price: roundedPrice,
              quantity: 1
            }
          });

          return;
        }
      }

      this.widgetsSharedDataService.setDataProviderValue<SelectedPriceData>(this.selectedPriceProviderName, {
        price: roundedPrice,
        badgeColor: x.settings.widgetSettings.badgeColor!
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
    if(enabled) {
      enabledSet.add(feature);
    } else {
      disabledSet.add(feature);
    }
  }

  private createExtensionContext(
    settings: TechChartSettings,
    theme: ThemeSettings): ChartContext {
    return {
      settings,
      theme,
      host: this.chartState!.widget
    };
  }
}
