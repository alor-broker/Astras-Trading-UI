import {
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
import { Widget } from 'src/app/shared/models/widget.model';
import { LightChartSettings } from '../../../../shared/models/settings/light-chart-settings.model';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { filter, map, mergeMap, switchMap } from 'rxjs/operators';
import { LightChartService } from '../../services/light-chart.service';
import { Candle } from '../../../../shared/models/history/candle.model';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { LightChart } from '../../utils/light-chart';
import { HistoryRequest } from 'src/app/shared/models/history/history-request.model';

@Component({
  selector: 'ats-light-chart[resize][widget]',
  templateUrl: './light-chart.component.html',
  styleUrls: ['./light-chart.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LightChartComponent implements OnInit, OnDestroy {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<LightChartSettings>;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Input('settings') set settings(settings: LightChartSettings) {
    this.settings$.next(settings);
  }
  private settings$ = new BehaviorSubject<LightChartSettings | null>(null);
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  bars$: Observable<Candle | null> = of(null);
  resizeSub!: Subscription;
  guid: string | null = null;

  private history$ = new Observable<void>();
  private historySub!: Subscription;
  private barsSub!: Subscription;
  private isUpdating = false;
  private isEndOfHistory = false;
  private chart = new LightChart();

  constructor(private service: LightChartService) { }

  ngOnInit(): void {
    this.guid = GuidGenerator.newGuid();
    this.bars$ = this.service.getBars();
  }

  ngOnDestroy(): void {
    this.chart.clear();
    this.service.unsubscribe();
    this.barsSub.unsubscribe();
    this.historySub.unsubscribe();
    this.resizeSub.unsubscribe();
  }

  ngAfterViewInit() {
    if (this.guid) {
      this.initChart(this.guid);
      this.barsSub = this.bars$.subscribe((candle) => {
        if (candle) {
          this.chart.update(candle);
        }
      });
      this.resizeSub = this.resize.subscribe((item) => {
        this.chart.resize(item.width ?? 0, item.height ?? 0);
      });
    }

    this.historySub = this.history$.subscribe();
  }

  private initChart(guid: string) {
    this.chart.create(guid);

    this.history$ = this.chart.logicalRange$.pipe(
      filter(lr => !this.isUpdating && !this.isEndOfHistory && !!lr),
      map(lr =>  {
        const options = this.service.getSettings();
        if (options) {
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
        const options = this.service.getSettings();
        if (options) {
         this.chart.setData(res.history, options);
        }
        this.isUpdating = false;
      })
    )
  }
}
