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
import { LightChartSettings } from '../../../../shared/models/settings/light-chart-settings.model';
import { BehaviorSubject, Observable, of, Subject, takeUntil } from 'rxjs';
import { filter, map, mergeMap, switchMap } from 'rxjs/operators';
import { LightChartService } from '../../services/light-chart.service';
import { Candle } from '../../../../shared/models/history/candle.model';
import { LightChart } from '../../utils/light-chart';
import { HistoryRequest } from 'src/app/shared/models/history/history-request.model';
import { isEqualLightChartSettings } from 'src/app/shared/utils/settings-helper';
import { TimeframesHelper } from '../../utils/timeframes-helper';

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

  bars$: Observable<Candle | null> = of(null);
  activeTimeFrame$ = new BehaviorSubject('D');
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private prevOptions?: LightChartSettings;
  private isUpdating = false;
  private isEndOfHistory = false;
  private chart?: LightChart;

  constructor(private service: LightChartService) {
  }

  ngOnInit(): void {
    this.bars$ = this.service.getBars(this.guid);
  }

  ngOnDestroy(): void {
    this.chart?.clear();
    this.service.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.complete();
    this.activeTimeFrame$.complete();
  }

  changeTimeframe(timeframe: string) {
    this.service.changeTimeframe(timeframe);
  }

  ngAfterViewInit() {
    if (this.guid) {
      this.initChart(this.guid);

      this.bars$.pipe(
        takeUntil(this.destroy$)
      ).subscribe((candle) => {
        if (candle && this.chart) {
          this.chart.update(candle);
        }
      });

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

  private initChart(guid: string) {
    const settings = this.service.getSettingsValue();
    this.chart = new LightChart(settings?.width ?? 300, (settings?.height ?? 300) - this.heightAdjustment);
    this.chart.create(guid);

    this.service.getSettings(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(options => {
      if (options && !isEqualLightChartSettings(options, this.prevOptions)) {
        this.prevOptions = options;
        this.setActiveTimeFrame(options.timeFrame);
        if (this.chart) {
          this.chart.clearSeries();
        }
      }
    });

    this.chart.logicalRange$.pipe(
      filter(lr => !this.isUpdating && !this.isEndOfHistory && !!lr),
      switchMap(() => {
        return this.service.getSettings(this.guid);
      }),
      map(options => {
        if (options && this.chart) {
          return this.chart.getRequest(options);
        }
        else return null;
      }),
      filter((r): r is HistoryRequest => !!r && !this.isUpdating),
      mergeMap(r => {
        this.isUpdating = true;
        return this.service.getHistory(r);
      }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.isEndOfHistory = res.prev == null;
      const options = this.service.getSettingsValue();
      if (options && this.chart) {
        this.chart.setData(res.history, options);
      }
      this.isUpdating = false;
    });
  }

  private setActiveTimeFrame(timeFrame: string) {
    // for some reason template is not updated without using setTimeout
    setTimeout(()=> this.activeTimeFrame$.next(timeFrame));
  }
}
