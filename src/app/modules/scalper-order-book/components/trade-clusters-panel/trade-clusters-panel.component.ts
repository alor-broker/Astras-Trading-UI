import {
  AfterViewInit,
  Component,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { ScalperOrderBookDataContext } from '../../models/scalper-order-book-data-context.model';
import {
  BehaviorSubject,
  bufferCount,
  combineLatest,
  fromEvent,
  Observable,
  of,
  shareReplay,
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
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';

@Component({
  selector: 'ats-trade-clusters-panel[xAxisStep][dataContext]',
  templateUrl: './trade-clusters-panel.component.html',
  styleUrls: ['./trade-clusters-panel.component.less']
})
export class TradeClustersPanelComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren(CdkScrollable)
  scrollContainer!: QueryList<CdkScrollable>;

  @Input()
  xAxisStep!: number;
  @Input()
  dataContext!: ScalperOrderBookDataContext;
  clusters$ = new Subject<Observable<TradesCluster>[]>;

  settings$!: Observable<ScalperOrderBookSettings>;

  hScrollOffsets$ = new BehaviorSubject({ left: 0, right: 0 });

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
    this.hScrollOffsets$.complete();
  }

  ngOnInit(): void {
    this.settings$ = this.dataContext.extendedSettings$.pipe(
      map(x => {
        const settings = x.widgetSettings;

        if(!!settings.tradesClusterPanelSettings) {
          return settings;
        }

        return {
          ...settings,
          tradesClusterPanelSettings: {
            timeframe: ClusterTimeframe.M1,
            displayIntervalsCount: 5,
            volumeDisplayFormat: NumberDisplayFormat.LetterSuffix
          }
        };
      }),
      shareReplay(1)
    );

    combineLatest([
      timer(0, 5000),
      this.settings$
    ]).pipe(
      map(([, settings]) => settings),
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(settings => {
      this.updateScrollOffsets();
      const panelSettings = settings.tradesClusterPanelSettings!;

      this.tradeClustersService.getHistory(
        settings,
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
        this.updateScrollOffsets();
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
        x.guid,
        {
          tradesClusterPanelSettings: {
            ...x.tradesClusterPanelSettings!,
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
        x.guid,
        {
          tradesClusterPanelSettings: {
            ...x.tradesClusterPanelSettings!,
            displayIntervalsCount: value
          }
        }
      );
    });
  }

  startScrolling($event: MouseEvent) {
    $event.preventDefault();

    this.contextMenuService.close(true);

    if ($event.button !== 0) {
      return;
    }

    if (this.getScrollContainer().measureScrollOffset('right') === 0
      && this.getScrollContainer().measureScrollOffset('left') === 0) {
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
      const currentRightOffset = this.getScrollContainer().measureScrollOffset('right');
      const currentLeftOffset = this.getScrollContainer().measureScrollOffset('left');

      if (movement < 0 && currentRightOffset > 0) {
        this.scrollContainer.first.scrollTo({
          right: Math.max(0, currentRightOffset + movement)
        });

        return;
      }

      if (movement > 0 && currentLeftOffset > 0) {
        this.scrollContainer.first.scrollTo({
          left: Math.max(0, currentLeftOffset - movement)
        });
      }
    });
  }

  ngAfterViewInit(): void {
    const initScrollWatching = () => {
      this.getScrollContainer().elementScrolled().pipe(
        takeUntil(this.destroyable.destroyed$)
      ).subscribe(() => this.updateScrollOffsets());
    };

    if (this.scrollContainer.length > 0) {
      initScrollWatching();
    }
    else {
      this.scrollContainer.changes.pipe(
        take(1)
      ).subscribe(() => initScrollWatching());
    }
  }

  private getScrollContainer(): CdkScrollable {
    return this.scrollContainer!.first;
  }

  private updateScrollOffsets() {
    const container = this.getScrollContainer();
    if (!container) {
      return;
    }

    this.hScrollOffsets$.next(({
      left: Math.abs(container.measureScrollOffset('left')),
      right: Math.abs(container.measureScrollOffset('right'))
    }));
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
