import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { DashboardItemContentSize } from 'src/app/shared/models/dashboard-item.model';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Subject,
  Subscription,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { LightChartService } from '../../services/light-chart.service';
import { LightChart } from '../../utils/light-chart';
import { HistoryRequest } from 'src/app/shared/models/history/history-request.model';
import { isEqualLightChartSettings } from 'src/app/shared/utils/settings-helper';
import { TimeframesHelper } from '../../utils/timeframes-helper';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";

@Component({
  selector: 'ats-light-chart[contentSize][guid]',
  templateUrl: './light-chart.component.html',
  styleUrls: ['./light-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LightChartComponent implements OnDestroy, AfterViewInit, OnChanges {
  readonly availableTimeFrames = TimeframesHelper.timeFrames;

  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  contentSize!: DashboardItemContentSize | null;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  activeTimeFrame$ = new BehaviorSubject('D');
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private isUpdating = false;
  private isEndOfHistory = false;
  private chart?: LightChart;
  private chartDataSubscription?: Subscription;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: LightChartService,
    private readonly timezoneConverterService: TimezoneConverterService) {
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

  private initChart(guid: string) {
    combineLatest([
        this.service.getExtendedSettings(guid),
        this.timezoneConverterService.getConverter()
      ]
    ).pipe(
      map(([ws, c]) => ({
        widgetSettings: ws,
        converter: c
      })),
      filter(x => !!x.converter && !!x.widgetSettings),
      distinctUntilChanged((previous, current) =>
          !previous
          || (
            isEqualLightChartSettings(previous.widgetSettings, current.widgetSettings)
            && previous.converter === current.converter
          )
      ),
      takeUntil(this.destroy$)
    ).subscribe(options => {
      this.chartDataSubscription?.unsubscribe();
      this.service.unsubscribe();

      if (!this.chart) {
        this.chart = new LightChart(options.widgetSettings?.width ?? 300, (options.widgetSettings?.height ?? 300));
        this.chart.create(guid);

        this.chartResize();
      }

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
