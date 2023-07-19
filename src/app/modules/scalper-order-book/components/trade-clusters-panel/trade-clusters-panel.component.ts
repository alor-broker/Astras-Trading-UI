import {
  AfterViewInit,
  Component, DestroyRef,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import {ScalperOrderBookDataContext,} from '../../models/scalper-order-book-data-context.model';
import {
  BehaviorSubject,
  bufferCount,
  combineLatest,
  fromEvent,
  Observable,
  shareReplay,
  take,
  takeUntil,
  timer,
} from 'rxjs';
import {TradesCluster} from '../../models/trades-clusters.model';
import {finalize, map, startWith, switchMap, tap} from 'rxjs/operators';
import {NzDropdownMenuComponent} from 'ng-zorro-antd/dropdown';
import {
  ClusterTimeframe,
  ScalperOrderBookSettings,
  TradesClusterPanelSettings
} from '../../models/scalper-order-book-settings.model';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {CdkScrollable} from '@angular/cdk/overlay';
import {DOCUMENT} from '@angular/common';
import {ContextMenuService} from '../../../../shared/services/context-menu.service';
import {TradeClustersService} from '../../services/trade-clusters.service';
import {toUnixTime} from '../../../../shared/utils/datetime';
import {mapWith} from "../../../../shared/utils/observable-helper";
import {NumberDisplayFormat} from "../../../../shared/models/enums/number-display-format";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-trade-clusters-panel',
  templateUrl: './trade-clusters-panel.component.html',
  styleUrls: ['./trade-clusters-panel.component.less']
})
export class TradeClustersPanelComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren(CdkScrollable)
  scrollContainer!: QueryList<CdkScrollable>;

  @Input({required: true})
  xAxisStep!: number;
  @Input({required: true})
  dataContext!: ScalperOrderBookDataContext;

  clusters$!: Observable<TradesCluster[]>;

  settings$!: Observable<ScalperOrderBookSettings>;

  hScrollOffsets$ = new BehaviorSubject({left: 0, right: 0});

  readonly availableTimeframes: number[] = Object.values(ClusterTimeframe).filter((v): v is number => !isNaN(Number(v)));
  readonly availableIntervalsCount = [1, 2, 5];

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly tradeClustersService: TradeClustersService,
    private readonly contextMenuService: ContextMenuService,
    @Inject(DOCUMENT)
    private readonly documentRef: Document,
    private readonly ngZone: NgZone,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnDestroy(): void {
    this.hScrollOffsets$.complete();
  }

  ngOnInit(): void {
    this.initSettings();
    this.initClustersStream();
  }

  trackBy(index: number, item: TradesCluster): number {
    return item.timestamp;
  }

  contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent): void {
    this.contextMenuService.create($event, menu, {scrollStrategy: 'noop'});
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
      map(({clientX}) => clientX),
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
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => this.updateScrollOffsets());
    };

    if (this.scrollContainer.length > 0) {
      initScrollWatching();
    } else {
      this.scrollContainer.changes.pipe(
        take(1)
      ).subscribe(() => initScrollWatching());
    }
  }

  private initSettings() {
    this.settings$ = this.dataContext.extendedSettings$.pipe(
      map(x => {
        const settings = x.widgetSettings;

        if (!!settings.tradesClusterPanelSettings) {
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
  }

  private initClustersStream() {
    this.clusters$ = this.settings$.pipe(
      mapWith(
        s => this.tradeClustersService.getHistory(
          s,
          s.tradesClusterPanelSettings!.timeframe,
          s.tradesClusterPanelSettings!.displayIntervalsCount,
        ),
        (settings, history) => ({settings, history})
      ),
      switchMap(x => this.getClusterUpdatesStream(x.settings, x.history ?? [])),
      tap(() => this.updateScrollOffsets())
    );
  }

  private getClusterUpdatesStream(
    settings: ScalperOrderBookSettings,
    history: TradesCluster[]
  ): Observable<TradesCluster[]> {
    const lastHistoryPoint = history.length > 0
      ? history[0].timestamp
      : toUnixTime(new Date());

    const updatesSubscription$ = this.tradeClustersService.getClustersSubscription(
      settings,
      settings.tradesClusterPanelSettings!.timeframe,
      lastHistoryPoint
    ).pipe(
      startWith(null)
    );

    const state = [
      ...this.toDisplayClusters(history, settings.tradesClusterPanelSettings!)
    ];

    return combineLatest([
      timer(0, Math.min(Math.floor((settings.tradesClusterPanelSettings!.timeframe / 2) * 1000), 60 * 1000)),
      updatesSubscription$
    ]).pipe(
      map(([, updates]) => {
        const allClusters = !updates
          ? state
          : [
            {
              ...updates,
              timestamp: this.getPeriodStart(updates.timestamp, settings.tradesClusterPanelSettings!.timeframe)
            },
            ...state.filter(s => s.timestamp !== updates.timestamp)
          ];

        const updated = this.toDisplayClusters(allClusters, settings.tradesClusterPanelSettings!);

        state.length = 0;
        state.push(...updated);
        return state;
      })
    );
  }

  private getScrollContainer(): CdkScrollable {
    return this.scrollContainer!.first;
  }

  private toDisplayClusters(
    allClusters: TradesCluster[],
    settings: TradesClusterPanelSettings,
  ): TradesCluster[] {
    const intervalsToDisplay = this.getDisplayIntervals(
      settings.timeframe,
      settings.displayIntervalsCount);
    const displayClusters: TradesCluster[] = [];

    for (let interval of intervalsToDisplay) {
      const cluster = allClusters.find(c => c.timestamp === interval);
      displayClusters.push({
        ...cluster,
        timestamp: interval,
        tradeClusters: cluster?.tradeClusters ?? []
      });
    }

    return displayClusters;
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
    const periodStart = this.getPeriodStart(toUnixTime(new Date()), timeframe);

    const intervals = [periodStart];
    for (let i = 1; i < displayIntervalsCount; i++) {
      const newInterval = Math.floor(intervals[i - 1] - timeframe);
      intervals.push(newInterval);
    }

    return intervals;
  }

  private getPeriodStart(unixTime: number, timeframe: ClusterTimeframe): number {
    return Math.floor(Math.floor(unixTime / timeframe) * timeframe);
  }
}
