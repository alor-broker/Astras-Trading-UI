import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component, DestroyRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, Observable} from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { TimeframesHelper } from '../../utils/timeframes-helper';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ThemeService } from '../../../../shared/services/theme.service';
import { LightChartWrapper } from '../../utils/light-chart-wrapper';
import { LightChartDatafeedFactoryService } from '../../services/light-chart-datafeed-factory.service';
import { TimeframeValue } from '../../models/light-chart.models';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { ContentSize } from '../../../../shared/models/dashboard/dashboard-item.model';
import {
  LightChartSettings,
  TimeFrameDisplayMode
} from '../../models/light-chart-settings.model';
import { TranslatorService } from "../../../../shared/services/translator.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

type LightChartSettingsExtended = LightChartSettings & { minstep?: number };

@Component({
  selector: 'ats-light-chart',
  templateUrl: './light-chart.component.html',
  styleUrls: ['./light-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LightChartComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly availableTimeFrames = TimeframesHelper.timeFrames;
  timeFrameDisplayModes = TimeFrameDisplayMode;

  @Input({required: true})
  guid!: string;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  activeTimeFrame$ = new BehaviorSubject('D');
  settings$!: Observable<LightChartSettingsExtended>;
  private chart?: LightChartWrapper;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly instrumentsService: InstrumentsService,
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly themeService: ThemeService,
    private readonly lightChartDatafeedFactoryService: LightChartDatafeedFactoryService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<LightChartSettings>(this.guid).pipe(
      map(x => x as LightChartSettingsExtended),
      switchMap(settings => {
        return this.instrumentsService.getInstrument({
          symbol: settings.symbol,
          exchange: settings.exchange,
          instrumentGroup: settings.instrumentGroup
        }).pipe(
          filter(x => !!x),
          map(x => ({
            ...settings,
            ...x
          } as LightChartSettingsExtended))
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.chart?.clear();
    this.activeTimeFrame$.complete();
  }

  changeTimeframe(timeframe: string) {
    this.settingsService.updateSettings<LightChartSettings>(this.guid, { timeFrame: timeframe });
  }

  ngAfterViewInit() {
    if (this.guid) {
      this.initChart();
    }
  }

  getTimeFrameLabel(value: string): string | undefined {
    return this.availableTimeFrames.find(x => x.value === value)?.label;
  }

  containerSizeChanged(entries: ResizeObserverEntry[]) {
    entries.forEach(x => {
      this.chartResize({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  private initChart() {
    combineLatest([
      this.settings$,
      this.timezoneConverterService.getConverter(),
      this.themeService.getThemeSettings(),
      this.translatorService.getLangChanges(),
    ])
      .pipe(
        map(([ws, c, t, l]) => ({
          widgetSettings: ws,
          converter: c,
          theme: t,
          locale: l
        })),
        filter(x => !!x.converter && !!x.widgetSettings),
        distinctUntilChanged((previous, current) =>
            !previous
            || (
              this.isEqualLightChartSettings(previous.widgetSettings, current.widgetSettings)
              && previous.converter === current.converter
              && previous.theme?.theme === current.theme?.theme
              && previous.locale === current.locale
            )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(options => {
        this.chart?.clear();
        const timeFrame = options.widgetSettings.timeFrame as TimeframeValue;

        this.setActiveTimeFrame(timeFrame);

        this.chart = LightChartWrapper.create({
          containerId: this.guid,
          instrumentKey: options.widgetSettings,
          timeFrame: timeFrame,
          instrumentDetails: {
            priceMinStep: options.widgetSettings.minstep ?? 0.01
          },
          dataFeed: this.lightChartDatafeedFactoryService.getDatafeed(options.widgetSettings, timeFrame),
          themeColors: options.theme.themeColors,
          timeConvertor: {
            toDisplayTime: time => options.converter.toTerminalUtcDate(time).getTime() / 1000
          },
          locale: options.locale
        });
      });
  }

  private isEqualLightChartSettings(
    settings1?: LightChartSettings,
    settings2?: LightChartSettings
  ) {
    if (settings1 && settings2) {
      return (
        settings1.symbol == settings2.symbol &&
        settings1.instrumentGroup == settings2.instrumentGroup &&
        settings1.linkToActive == settings2.linkToActive &&
        settings1.exchange == settings2.exchange &&
        settings1.timeFrame == settings2.timeFrame &&
        settings1.guid == settings2.guid &&
        settings1.width == settings2.width &&
        settings1.height == settings2.height &&
        settings1.badgeColor == settings2.badgeColor &&
        settings1.timeFrameDisplayMode == settings2.timeFrameDisplayMode
      );
    } else return false;
  }

  private setActiveTimeFrame(timeFrame: string) {
    // for some reason template is not updated without using setTimeout
    setTimeout(() => this.activeTimeFrame$.next(timeFrame));
  }

  private chartResize(contentSize: ContentSize) {
    this.chart?.resize(Math.floor(contentSize.width ?? 0), Math.floor(contentSize.height ?? 0));
  }
}
