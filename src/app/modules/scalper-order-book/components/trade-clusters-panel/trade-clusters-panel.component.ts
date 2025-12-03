import {
  AfterViewInit,
  Component,
  DestroyRef,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  DOCUMENT
} from '@angular/core';
import { ScalperOrderBookDataContext, } from '../../models/scalper-order-book-data-context.model';
import {
  BehaviorSubject,
  bufferCount,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  Observable,
  shareReplay,
  take,
  takeUntil,
  timer,
} from 'rxjs';
import { TradesCluster } from '../../models/trades-clusters.model';
import {
  finalize,
  map,
  startWith,
  switchMap,
  tap
} from 'rxjs/operators';
import { NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import {
  ClusterTimeframe,
  ScalperOrderBookWidgetSettings,
  TradesClusterPanelSettings
} from '../../models/scalper-order-book-settings.model';
import { CdkScrollable } from '@angular/cdk/overlay';

import { ContextMenuService } from '../../../../shared/services/context-menu.service';
import { TradeClustersService } from '../../services/trade-clusters.service';
import { toUnixTime } from '../../../../shared/utils/datetime';
import { mapWith } from "../../../../shared/utils/observable-helper";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { isInstrumentEqual } from "../../../../shared/utils/settings-helper";
import { ScalperOrderBookSettingsWriteService } from "../../services/scalper-order-book-settings-write.service";
import { TradesClusterPanelSettingsDefaults } from "../scalper-order-book-settings/constants/settings-defaults";

@Component({
    selector: 'ats-trade-clusters-panel',
    templateUrl: './trade-clusters-panel.component.html',
    styleUrls: ['./trade-clusters-panel.component.less'],
    standalone: false
})
export class TradeClustersPanelComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren(CdkScrollable)
  scrollContainer!: QueryList<CdkScrollable>;

  @Input({required: true})
  xAxisStep!: number;

  @Input({required: true})
  dataContext!: ScalperOrderBookDataContext;

  clusters$!: Observable<TradesCluster[]>;

  settings$!: Observable<ScalperOrderBookWidgetSettings>;

  hScrollOffsets$ = new BehaviorSubject({left: 0, right: 0});

  readonly availableTimeframes: number[] = Object.values(ClusterTimeframe).filter((v): v is number => !isNaN(Number(v)));
  readonly availableIntervalsCount = [1, 2, 5];

  private isAutoScroll = true;

  constructor(
    private readonly settingsWriteService: ScalperOrderBookSettingsWriteService,
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

  setTimeframe(value: number): void {
    this.updateTradesClusterPanelSettings({
      timeframe: value
    });
  }

  setIntervalsCount(value: number): void {
    this.updateTradesClusterPanelSettings({
      displayIntervalsCount: value
    });
  }

  startScrolling($event: MouseEvent): void {
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
      this.documentRef.body.style.cursor = "ew-resize";
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
      if (!(this.scrollContainer as QueryList<CdkScrollable> | undefined)) {
        return;
      }

      const movement = x2 - x1;
      const currentRightOffset = this.getScrollContainer().measureScrollOffset('right');
      const currentLeftOffset = this.getScrollContainer().measureScrollOffset('left');

      if (movement < 0 && currentRightOffset > 0) {
        const updatedOffset = Math.ceil(Math.max(0, currentRightOffset + movement));
        this.scrollContainer.first.scrollTo({
          right: updatedOffset
        });

        this.isAutoScroll = updatedOffset === 0;
      } else if (movement > 0 && currentLeftOffset > 0) {
        this.scrollContainer.first.scrollTo({
          left: Math.ceil(Math.max(0, currentLeftOffset - movement))
        });

        this.isAutoScroll = false;
      }
    });
  }

  ngAfterViewInit(): void {
    const initScrollWatching = (): void => {
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

  private initSettings(): void {
    this.settings$ = this.dataContext.extendedSettings$.pipe(
      map(x => {
        const settings = x.widgetSettings;

        if (!!settings.tradesClusterPanelSettings) {
          return settings;
        }

        return {
          ...settings,
          tradesClusterPanelSettings: {...TradesClusterPanelSettingsDefaults}
        };
      }),
      shareReplay(1)
    );
  }

  private initClustersStream(): void {
    this.clusters$ = this.settings$.pipe(
      distinctUntilChanged((prev, curr) => {
        return isInstrumentEqual(prev, curr)
          && prev.tradesClusterPanelSettings?.timeframe === curr.tradesClusterPanelSettings?.timeframe
          && prev.tradesClusterPanelSettings?.displayIntervalsCount === curr.tradesClusterPanelSettings?.displayIntervalsCount;
      }),
      tap(() => this.isAutoScroll = true),
      mapWith(
        s => this.tradeClustersService.getHistory(
          s,
          s.tradesClusterPanelSettings?.timeframe ?? TradesClusterPanelSettingsDefaults.timeframe,
          s.tradesClusterPanelSettings?.displayIntervalsCount ?? TradesClusterPanelSettingsDefaults.displayIntervalsCount,
        ),
        (settings, history) => ({settings, history})
      ),
      switchMap(x => this.getClusterUpdatesStream(x.settings, x.history ?? [])),
      tap(() => this.updateScrollOffsets(true))
    );
  }

  private getClusterUpdatesStream(
    settings: ScalperOrderBookWidgetSettings,
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
        if(updates == null) {
          return state;
        }

        const lastTimestamp = this.getPeriodStart(updates.timestamp, settings.tradesClusterPanelSettings!.timeframe);
        const allClusters = [
          ...state.filter(s => s.timestamp !== lastTimestamp),
          {
            ...updates,
            timestamp: lastTimestamp
          }
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

    for (const interval of intervalsToDisplay) {
      const cluster = allClusters.find(c => c.timestamp === interval);
      displayClusters.push({
        ...cluster,
        timestamp: interval,
        tradeClusters: cluster?.tradeClusters ?? []
      });
    }

    return displayClusters;
  }

  private updateScrollOffsets(updateStart = false): void {
    const container = this.getScrollContainer() as CdkScrollable | undefined;
    if (!container) {
      return;
    }

    let leftOffset = Math.abs(container.measureScrollOffset('left'));
    let rightOffset = Math.abs(container.measureScrollOffset('right'));

    if(updateStart && this.isAutoScroll && rightOffset >= 0) {
      container.scrollTo({right: 0});
      leftOffset = Math.abs(container.measureScrollOffset('left'));
      rightOffset = Math.abs(container.measureScrollOffset('right'));
    }

    this.hScrollOffsets$.next(({
      left: leftOffset,
      right: rightOffset
    }));
  }

  private getDisplayIntervals(timeframe: ClusterTimeframe, displayIntervalsCount: number): number[] {
    const periodStart = this.getPeriodStart(toUnixTime(new Date()), timeframe);

    const intervals = [periodStart];
    for (let i = 1; i < displayIntervalsCount; i++) {
      const newInterval = Math.floor(intervals[i - 1] - timeframe);
      intervals.push(newInterval);
    }

    return intervals.reverse();
  }

  private getPeriodStart(unixTime: number, timeframe: ClusterTimeframe): number {
    return Math.floor(Math.floor(unixTime / timeframe) * timeframe);
  }

  private updateTradesClusterPanelSettings(updates: Partial<TradesClusterPanelSettings>): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.settingsWriteService.updateInstrumentLinkedSettings(
        {
          tradesClusterPanelSettings: {
            ...s.tradesClusterPanelSettings!,
            ...updates
          }
        },
        s
      );
    });
  }
}
