import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
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
import {LightChartWrapper} from '../../utils/light-chart-wrapper';
import {LightChartDatafeedFactoryService} from '../../services/light-chart-datafeed-factory.service';
import {
  takeUntilDestroyed,
  toObservable
} from "@angular/core/rxjs-interop";
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {AsyncPipe} from '@angular/common';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {TimeFrameDisplayMode} from '@terminal-widgets-lib/widgets/light-chart/widget-settings.types';
import {TimeframeValue} from '@terminal-widgets-lib/widgets/light-chart/types/light-chart.types';
import {TimeframesPanel} from '@terminal-widgets-lib/widgets/light-chart/components/timeframes-panel/timeframes-panel';
import {GuidGenerator} from '@terminal-core-lib/common/utils/guid-generator';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {TimezoneConverterService} from '@terminal-core-lib/features/timezones/services/timezone-converter.service';
import {ThemeService} from "@terminal-core-lib/features/themes/services/theme.service";
import {InstrumentEqualityComparer} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {ContentSize} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';

export interface LightChartDisplaySettings {
  targetInstrument: InstrumentKey;
  chart: {
    timeFrameDisplayMode?: TimeFrameDisplayMode;
    availableTimeFrames?: TimeframeValue[];
  };
}

interface ChartSettingsExtended extends LightChartDisplaySettings {
  instrumentDetails: {
    minstep?: number;
  };
}

@Component({
  selector: 'ats-light-chart',
  templateUrl: './light-chart.html',
  styleUrls: ['./light-chart.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NzResizeObserverDirective,
    TimeframesPanel,
    AsyncPipe
  ]
})
export class LightChartComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly timeFrameDisplayModes = TimeFrameDisplayMode;

  readonly settings = input.required<LightChartDisplaySettings>();

  readonly selectedTimeframe = model(TimeframeValue.Day);

  protected availableTimeFrames$!: Observable<TimeframeValue[]>;

  protected extendedSettings$!: Observable<ChartSettingsExtended>;

  protected readonly chartContainerId = GuidGenerator.newGuid();

  private readonly selectedTimeframeChanges$ = toObservable(this.selectedTimeframe);

  private readonly instrumentsService = inject(InstrumentsService);

  private readonly timezoneConverterService = inject(TimezoneConverterService);

  private readonly themeService = inject(ThemeService);

  private readonly lightChartDatafeedFactoryService = inject(LightChartDatafeedFactoryService);

  private readonly translatorService = inject(TranslatorService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly settingsChanges$ = toObservable<LightChartDisplaySettings>(this.settings).pipe(
    shareReplay(1)
  );

  private chart?: LightChartWrapper;

  ngOnInit(): void {
    this.extendedSettings$ = this.settingsChanges$.pipe(
      switchMap(settings => {
        return this.instrumentsService.getInstrument({
          symbol: settings.targetInstrument.symbol,
          exchange: settings.targetInstrument.exchange,
          instrumentGroup: settings.targetInstrument.instrumentGroup
        }).pipe(
          filter(x => !!x),
          map(x => ({
            ...settings,
            instrumentDetails: {
              ...x
            }
          } satisfies ChartSettingsExtended))
        );
      }),
    );

    this.availableTimeFrames$ = this.settingsChanges$.pipe(
      map(s => {
        return s.chart.availableTimeFrames ?? Object.values(TimeframeValue);
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  ngOnDestroy(): void {
    this.chart?.clear();
  }

  ngAfterViewInit(): void {
    this.initChart();
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
    combineLatest({
      widgetSettings: this.extendedSettings$,
      converter: this.timezoneConverterService.getConverter(),
      theme: this.themeService.getThemeSettings(),
      locale: this.translatorService.getLangChanges(),
      timeframe: this.selectedTimeframeChanges$
    })
      .pipe(
        distinctUntilChanged((previous, current) =>
          this.isEqualLightChartSettings(previous.widgetSettings, current.widgetSettings)
          && previous.converter === current.converter
          && previous.theme.theme === current.theme.theme
          && previous.locale === current.locale
          && previous.timeframe === current.timeframe
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(options => {
        this.chart?.clear();
        const timeFrame = options.timeframe;

        this.chart = LightChartWrapper.create({
          containerId: this.chartContainerId,
          instrumentKey: options.widgetSettings.targetInstrument,
          timeFrame: timeFrame,
          instrumentDetails: {
            priceMinStep: options.widgetSettings.instrumentDetails.minstep ?? 0.01
          },
          dataFeed: this.lightChartDatafeedFactoryService.getDatafeed(options.widgetSettings.targetInstrument, timeFrame),
          themeColors: options.theme.themeColors,
          timeConvertor: {
            toDisplayTime: time => options.converter.toTerminalUtcDate(time).getTime() / 1000
          },
          locale: options.locale
        });
      });
  }

  private isEqualLightChartSettings(
    settings1?: LightChartDisplaySettings,
    settings2?: LightChartDisplaySettings
  ): boolean {
    if (settings1 && settings2) {
      return InstrumentEqualityComparer.equals(settings1?.targetInstrument, settings2?.targetInstrument);
    } else return false;
  }

  private chartResize(contentSize: ContentSize): void {
    this.chart?.resize(Math.floor((contentSize.width as number | undefined) ?? 0), Math.floor((contentSize.height as number | undefined) ?? 0));
  }
}
