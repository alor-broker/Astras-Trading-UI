import {
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
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { LightChartSettings } from '../../../../shared/models/settings/light-chart-settings.model';
import { BehaviorSubject, Observable, of, Subject, Subscription } from 'rxjs';
import { filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { LightChartService } from '../../services/light-chart.service';
import { Candle } from '../../../../shared/models/history/candle.model';
import { LightChart } from '../../utils/light-chart';
import { HistoryRequest } from 'src/app/shared/models/history/history-request.model';
import { isEqualLightChartSettings } from 'src/app/shared/utils/settings-helper';
import { GuidGenerator } from 'src/app/shared/utils/guid';

@Component({
  selector: 'ats-light-chart[resize][guid][resize]',
  templateUrl: './light-chart.component.html',
  styleUrls: ['./light-chart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LightChartComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  bars$: Observable<Candle | null> = of(null);

  private prevOptions?: LightChartSettings;
  private historySub?: Subscription;
  private settingsSub?: Subscription;
  private resizeSub?: Subscription;
  private barsSub?: Subscription;
  private isUpdating = false;
  private isEndOfHistory = false;
  private chart?: LightChart;
  activeTimeFrame: Subject<string> = new BehaviorSubject('D');

  constructor(private service: LightChartService) { }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes.shouldShowSettings)
  }

  ngOnInit(): void {
    this.bars$ = this.service.getBars(this.guid);
  }

  ngOnDestroy(): void {
    this.chart?.clear();
    this.service.unsubscribe();
    this.barsSub?.unsubscribe();
    this.historySub?.unsubscribe();
    this.resizeSub?.unsubscribe();
  }

  changeTimeframe(timeframe: string) {
    this.service.changeTimeframe(timeframe);
  }

  ngAfterViewInit() {
    if (this.guid) {
      this.initChart(this.guid);
      this.barsSub = this.bars$.subscribe((candle) => {
        if (candle && this.chart) {
          this.chart.update(candle);
        }
      });
      this.resizeSub = this.resize.subscribe((item) => {
        if (this.chart) {
          this.chart.resize(item.width ?? 0, item.height ?? 0);
          const oldSettings = this.service.getSettingsValue();
          if (oldSettings) {
            const newSettings = {...oldSettings, width: item.width ?? 300, height: item.height ?? 300};
            this.service.setSettings(newSettings)
          }
        }
      });
    }
  }

  private initChart(guid: string) {
    const settings = this.service.getSettingsValue();
    this.chart = new LightChart(settings?.width ?? 300, settings?.height ?? 300);
    this.chart.create(guid);

    this.settingsSub = this.service.getSettings(this.guid).pipe(
      tap(options => {
        if (options && !isEqualLightChartSettings(options, this.prevOptions)){
          this.prevOptions == options;
          this.activeTimeFrame.next(options.timeFrame);
          if (this.chart) {
            this.chart.clearSeries();
          }
        }
      })
    ).subscribe();

    this.historySub = this.chart.logicalRange$.pipe(
      filter(lr => !this.isUpdating && !this.isEndOfHistory && !!lr),
      switchMap(lr => {
        return this.service.getSettings(this.guid);
      }),
      map(options =>  {
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
      map(res => {
        this.isEndOfHistory = res.prev == null;
        const options = this.service.getSettingsValue();
        if (options && this.chart) {
         this.chart.setData(res.history, options);
        }
        this.isUpdating = false;
      })
    ).subscribe()
  }
}
