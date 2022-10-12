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
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  Subject,
  Subscription,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
  LightChartService,
  LightChartSettingsExtended
} from '../../services/light-chart.service';
import { LightChart } from '../../utils/light-chart';
import { HistoryRequest } from 'src/app/shared/models/history/history-request.model';
import { isEqualLightChartSettings } from 'src/app/shared/utils/settings-helper';
import {
  TimeframesHelper
} from '../../utils/timeframes-helper';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ThemeService } from '../../../../shared/services/theme.service';
import { TimeFrameDisplayMode } from '../../../../shared/models/settings/light-chart-settings.model';

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
  private isUpdating = false;
  private isEndOfHistory = false;
  private chart?: LightChart;
  private chartDataSubscription?: Subscription;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: LightChartService,
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly themeService: ThemeService) {
  }

  ngOnInit(): void {
    this.settings$ = this.service.getExtendedSettings(this.guid);
  }

  ngOnDestroy(): void {
    this.chart?.clear();
    this.service.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.complete();
    this.activeTimeFrame$.complete();
    this.chartDataSubscription?.unsubscribe();
  }

  changeTimeframe(timeframe: string) {
    this.service.changeTimeframe(this.guid, timeframe);
  }

  ngAfterViewInit() {
    if (this.guid) {
      this.initChart(this.guid);
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

  private initChart(guid: string) {
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
      this.chartDataSubscription?.unsubscribe();
      this.service.unsubscribe();

      this.chart?.clear();

      this.chart = new LightChart(options.widgetSettings?.width ?? 300, (options.widgetSettings?.height ?? 300));
      this.chart.create(guid, options.theme.themeColors);
      this.chartResize();

      this.setActiveTimeFrame(options.widgetSettings.timeFrame);
      const currentTimeframe = TimeframesHelper.getTimeframeByValue(options.widgetSettings.timeFrame).value;

      // clear existing data
      this.isEndOfHistory = false;
      this.chart.prepareSeries(currentTimeframe, options.converter, options.widgetSettings.minstep);

      this.chartDataSubscription = this.service.getBars(options.widgetSettings)
        .subscribe((candle) => {
          if (candle && this.chart) {
            this.chart.update(candle);
            this.chart.checkMissingVisibleData();
          }
        });

      const historySubscription = this.chart.historyItemsCountToLoad$.pipe(
        filter(count => !this.isUpdating && !this.isEndOfHistory && count > 0),
        map(itemsCountToLoad => {
          if (this.chart) {
            return this.chart.getRequest(options.widgetSettings, itemsCountToLoad);
          } else return null;
        }),
        filter((r): r is HistoryRequest => !!r && !this.isUpdating),
        tap(() => this.isUpdating = true),
        switchMap(r => this.service.getHistory(r))
      ).subscribe(res => {
        this.isEndOfHistory = res.prev == null;
        this.chart?.setData(res.history, res.prev);
        this.isUpdating = false;

        // sometimes the downloaded data is not enough to fill the entire time scale space.
        // This is visible when the widget is stretched to full screen.
        // All changes were ignored by the filter !this.isUpdating.
        // Therefore after rendering we need to check again
        this.chart?.checkMissingVisibleData();
      });

      this.chartDataSubscription.add(historySubscription);
    });
  }

  private setActiveTimeFrame(timeFrame: string) {
    // for some reason template is not updated without using setTimeout
    setTimeout(() => this.activeTimeFrame$.next(timeFrame));
  }

  private chartResize() {
    this.chart!.resize(Math.floor(this.contentSize?.width ?? 0), Math.floor(this.contentSize?.height ?? 0));

    this.settingsService.updateSettings(
      this.guid,
      {
        width: this.contentSize?.width ?? 300,
        height: this.contentSize?.height ?? 300
      });
  }
}
