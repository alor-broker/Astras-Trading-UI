import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
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

@Component({
  selector: 'ats-light-chart[resize][guid][resize]',
  templateUrl: './light-chart.component.html',
  styleUrls: ['./light-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LightChartComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly availableTimeFrames = TimeframesHelper.timeFrames;

  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Input()
  heightAdjustment: number = 0;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  activeTimeFrame$ = new BehaviorSubject('D');
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private isUpdating = false;
  private isEndOfHistory = false;
  private chart?: LightChart;
  private chartDataSubscription?: Subscription;

  constructor(private readonly service: LightChartService, private readonly timezoneConverterService: TimezoneConverterService) {
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
    this.service.changeTimeframe(timeframe);
  }

  ngAfterViewInit() {
    if (this.guid) {
      this.initChart(this.guid);

      this.resize.pipe(
        takeUntil(this.destroy$)
      ).subscribe((item) => {
        if (this.chart) {
          this.chart.resize(
            item.width ?? 0,
            !!item.height ? item.height - this.heightAdjustment : 0);
          const oldSettings = this.service.getSettingsValue();
          if (oldSettings) {
            const newSettings = { ...oldSettings, width: item.width ?? 300, height: item.height ?? 300 };
            this.service.setSettings(newSettings);
          }
        }
      });
    }
  }

  ngOnInit(): void {
    this.service.initSettingsUpdates(this.guid);
  }

  private initChart(guid: string) {
    combineLatest([
        this.service.getSettings(guid),
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
        this.chart = new LightChart(options.widgetSettings?.width ?? 300, (options.widgetSettings?.height ?? 300) - this.heightAdjustment);
        this.chart.create(guid);
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
}
