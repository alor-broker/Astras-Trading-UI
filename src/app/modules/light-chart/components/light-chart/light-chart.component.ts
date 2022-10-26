import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { DashboardItemContentSize } from 'src/app/shared/models/dashboard-item.model';
import { BehaviorSubject, combineLatest, distinctUntilChanged, Observable, Subject, takeUntil } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { isEqualLightChartSettings } from 'src/app/shared/utils/settings-helper';
import { TimeframesHelper } from '../../utils/timeframes-helper';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ThemeService } from '../../../../shared/services/theme.service';
import {
  LightChartSettings,
  TimeFrameDisplayMode
} from '../../../../shared/models/settings/light-chart-settings.model';
import { LightChartWrapper } from '../../utils/light-chart-wrapper';
import { LightChartDatafeedFactoryService } from '../../services/light-chart-datafeed-factory.service';
import { TimeframeValue } from '../../models/light-chart.models';
import { InstrumentsService } from '../../../instruments/services/instruments.service';

type LightChartSettingsExtended = LightChartSettings & { minstep?: number };

@Component({
  selector: 'ats-light-chart[contentSize][guid]',
  templateUrl: './light-chart.component.html',
  styleUrls: ['./light-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LightChartComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  readonly availableTimeFrames = TimeframesHelper.timeFrames;
  timeFrameDisplayModes = TimeFrameDisplayMode;

  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  contentSize!: DashboardItemContentSize | null;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  activeTimeFrame$ = new BehaviorSubject('D');
  settings$!: Observable<LightChartSettingsExtended>;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private chart?: LightChartWrapper;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly instrumentsService: InstrumentsService,
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly themeService: ThemeService,
    private readonly lightChartDatafeedFactoryService: LightChartDatafeedFactoryService) {
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
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  changeTimeframe(timeframe: string) {
    this.settingsService.updateSettings<LightChartSettings>(this.guid, { timeFrame: timeframe });
  }

  ngAfterViewInit() {
    if (this.guid) {
      this.initChart();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.contentSize && !!this.chart) {
      this.chartResize();
    }
  }

  getTimeFrameLabel(value: string): string | undefined {
    return this.availableTimeFrames.find(x => x.value === value)?.label;
  }

  private initChart() {
    combineLatest([
        this.settings$,
        this.timezoneConverterService.getConverter(),
        this.themeService.getThemeSettings()
      ]
    ).pipe(
      map(([ws, c, t]) => ({
        widgetSettings: ws,
        converter: c,
        theme: t
      })),
      filter(x => !!x.converter && !!x.widgetSettings),
      distinctUntilChanged((previous, current) =>
          !previous
          || (
            isEqualLightChartSettings(previous.widgetSettings, current.widgetSettings)
            && previous.converter === current.converter
            && previous.theme?.theme === current.theme?.theme
          )
      ),
      takeUntil(this.destroy$)
    ).subscribe(options => {
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
        }
      });
    });
  }

  private setActiveTimeFrame(timeFrame: string) {
    // for some reason template is not updated without using setTimeout
    setTimeout(() => this.activeTimeFrame$.next(timeFrame));
  }

  private chartResize() {
    this.chart!.resize(Math.floor(this.contentSize?.width ?? 0), Math.floor(this.contentSize?.height ?? 0));
  }
}
