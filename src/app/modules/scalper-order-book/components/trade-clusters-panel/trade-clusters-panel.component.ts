import {
  Component,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from '../../models/scalper-order-book-data-context.model';
import {
  bufferCount,
  combineLatest,
  fromEvent,
  Observable,
  of,
  Subject,
  take,
  takeUntil,
  timer
} from 'rxjs';
import { TradesCluster } from '../../models/trades-clusters.model';
import {
  finalize,
  map,
  tap
} from 'rxjs/operators';
import { NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import {
  ClusterTimeframe,
  ScalperOrderBookSettings
} from '../../models/scalper-order-book-settings.model';
import { Destroyable } from '../../../../shared/utils/destroyable';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { CdkScrollable } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';
import { ContextMenuService } from '../../../../shared/services/context-menu.service';
import { TradeClustersService } from '../../services/trade-clusters.service';
import { toUnixTime } from '../../../../shared/utils/datetime';

@Component({
  selector: 'ats-trade-clusters-panel[xAxisStep][dataContext]',
  templateUrl: './trade-clusters-panel.component.html',
  styleUrls: ['./trade-clusters-panel.component.less']
})
export class TradeClustersPanelComponent implements OnInit, OnDestroy {
  @ViewChild(CdkScrollable)
  scrollContainer!: CdkScrollable;

  @Input()
  xAxisStep!: number;
  @Input()
  dataContext!: ScalperOrderBookDataContext;
  clusters$ = new Subject<Observable<TradesCluster>[]>;

  settings$!: Observable<ScalperOrderBookExtendedSettings>;

  readonly availableTimeframes: number[] = Object.values(ClusterTimeframe).filter((v): v is number => !isNaN(Number(v)));
  readonly availableIntervalsCount = [1, 2, 5];
  private readonly destroyable = new Destroyable();

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly tradeClustersService: TradeClustersService,
    private readonly contextMenuService: ContextMenuService,
    @Inject(DOCUMENT)
    private readonly documentRef: Document,
    private readonly ngZone: NgZone
  ) {
  }

  ngOnDestroy(): void {
    this.destroyable.destroy();
  }

  ngOnInit(): void {
    this.settings$ = this.dataContext.extendedSettings$;

    combineLatest([
      timer(0, 5000),
      this.settings$
    ]).pipe(
      map(([, settings]) => settings),
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(settings => {
      const panelSettings = settings.widgetSettings.tradesClusterPanelSettings!;

      this.tradeClustersService.getHistory(
        settings.widgetSettings,
        panelSettings.timeframe,
        panelSettings.displayIntervalsCount)
        .pipe(
          take(1)
        ).subscribe(history => {
        this.clusters$.next([]);

        if (!history) {
          return;
        }

        const displayClusters = [];
        const displayIntervals = this.getDisplayIntervals(panelSettings.timeframe, panelSettings.displayIntervalsCount);
        for (let interval of displayIntervals) {
          const cluster = history.find(x => x.timestamp === interval);

          displayClusters.push(of({
            timestamp: interval,
            tradeClusters: cluster?.tradeClusters ?? []
          }));
        }

        this.clusters$.next(displayClusters);
      });
    });
  }

  trackBy(index: number): number {
    return index;
  }

  contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent): void {
    this.contextMenuService.create($event, menu, { scrollStrategy: 'noop' });
  }

  setTimeframe(value: number) {
    this.settings$.pipe(
      take(1)
    ).subscribe(x => {
      this.widgetSettingsService.updateSettings<ScalperOrderBookSettings>(
        x.widgetSettings.guid,
        {
          tradesClusterPanelSettings: {
            ...x.widgetSettings.tradesClusterPanelSettings!,
            timeframe: value
          }
        }
      );
    });
  }

  setIntervalsCount(value: number) {
    this.settings$.pipe(
      take(1)
    ).subscribe(x => {
      this.widgetSettingsService.updateSettings<ScalperOrderBookSettings>(
        x.widgetSettings.guid,
        {
          tradesClusterPanelSettings: {
            ...x.widgetSettings.tradesClusterPanelSettings!,
            displayIntervalsCount: value
          }
        }
      );
    });
  }

  startScrolling($event: MouseEvent) {
    this.contextMenuService.close(true);

    if ($event.button !== 0) {
      return;
    }

    if (this.scrollContainer.measureScrollOffset('right') === 0
      && this.scrollContainer.measureScrollOffset('left') === 0) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.documentRef.body.style.cursor = "all-scroll";
    });

    fromEvent<MouseEvent>(this.documentRef, 'mousemove').pipe(
      tap(e => {
        e.preventDefault();
        e.stopPropagation();
      }),
      map(({ clientX }) => clientX),
      bufferCount(2),
      takeUntil(fromEvent(this.documentRef, 'mouseup')),
      finalize(() => {
        this.ngZone.runOutsideAngular(() => {
          this.documentRef.body.style.cursor = "default";
        });
      })
    ).subscribe(([x1, x2]) => {
      if (!this.scrollContainer) {
        return;
      }

      const movement = x2 - x1;
      const currentRightOffset = this.scrollContainer.measureScrollOffset('right');
      const currentLeftOffset = this.scrollContainer.measureScrollOffset('left');

      if (movement < 0 && currentRightOffset > 0) {
        this.scrollContainer.scrollTo({
          right: Math.max(0, currentRightOffset + movement)
        });

        return;
      }

      if (movement > 0 && currentLeftOffset > 0) {
        this.scrollContainer.scrollTo({
          left: Math.max(0, currentLeftOffset - movement)
        });
      }
    });
  }

  private getDisplayIntervals(timeframe: ClusterTimeframe, displayIntervalsCount: number): number[] {
    const now = toUnixTime(new Date());
    const periodStart = Math.floor(Math.floor(now / timeframe) * timeframe);

    const intervals = [periodStart];
    for (let i = 1; i < displayIntervalsCount; i++) {
      const newInterval = Math.floor(intervals[i - 1] - timeframe);
      intervals.push(newInterval);
    }

    return intervals;
  }
}
