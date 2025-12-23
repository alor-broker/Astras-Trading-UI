import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, ViewEncapsulation, input, output, inject } from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  Observable,
  shareReplay
} from 'rxjs';
import {
  filter,
  map,
  switchMap
} from 'rxjs/operators';
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
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NzResizeObserverDirective } from 'ng-zorro-antd/cdk/resize-observer';
import { TimeframesPanelComponent } from '../timeframes-panel/timeframes-panel.component';
import { AsyncPipe } from '@angular/common';

type LightChartSettingsExtended = LightChartSettings & { minstep?: number };

@Component({
    selector: 'ats-light-chart',
    templateUrl: './light-chart.component.html',
    styleUrls: ['./light-chart.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    imports: [
      NzResizeObserverDirective,
      TimeframesPanelComponent,
      AsyncPipe
    ]
})
export class LightChartComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly settingsService = inject(WidgetSettingsService);
  private readonly instrumentsService = inject(InstrumentsService);
  private readonly timezoneConverterService = inject(TimezoneConverterService);
  private readonly themeService = inject(ThemeService);
  private readonly lightChartDatafeedFactoryService = inject(LightChartDatafeedFactoryService);
  private readonly translatorService = inject(TranslatorService);
  private readonly destroyRef = inject(DestroyRef);

  availableTimeFrames$!: Observable<TimeframeValue[]>;
  timeFrameDisplayModes = TimeFrameDisplayMode;

  readonly guid = input.required<string>();

  readonly shouldShowSettingsChange = output<boolean>();

  settings$!: Observable<LightChartSettingsExtended>;
  private chart?: LightChartWrapper;

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<LightChartSettings>(this.guid()).pipe(
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

    this.availableTimeFrames$ = this.settings$.pipe(
      map(s => {
        return s.availableTimeFrames ?? Object.values(TimeframeValue);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  ngOnDestroy(): void {
    this.chart?.clear();
  }

  changeTimeframe(timeframe: TimeframeValue): void {
    this.settingsService.updateSettings<LightChartSettings>(this.guid(), { timeFrame: timeframe });
  }

  ngAfterViewInit(): void {
    if (this.guid()) {
      this.initChart();
    }
  }

  containerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.chartResize({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  private initChart(): void {
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
        distinctUntilChanged((previous, current) =>
          this.isEqualLightChartSettings(previous.widgetSettings, current.widgetSettings)
          && previous.converter === current.converter
          && previous.theme.theme === current.theme.theme
          && previous.locale === current.locale
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(options => {
        this.chart?.clear();
        const timeFrame = options.widgetSettings.timeFrame as TimeframeValue;

        this.chart = LightChartWrapper.create({
          containerId: this.guid(),
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
  ): boolean {
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

  private chartResize(contentSize: ContentSize): void {
    this.chart?.resize(Math.floor((contentSize.width as number | undefined) ?? 0), Math.floor((contentSize.height as number | undefined) ?? 0));
  }
}
