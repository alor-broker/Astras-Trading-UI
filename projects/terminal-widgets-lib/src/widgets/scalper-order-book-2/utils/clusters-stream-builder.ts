import {
  combineLatest,
  distinctUntilChanged,
  Observable,
  timer
} from 'rxjs';
import {
  map,
  startWith,
  switchMap
} from 'rxjs/operators';
import {getUnixTime} from 'date-fns';
import {TradeClustersService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/trade-clusters.service';
import {TradesClusterPanelSettingsDefaults} from '@terminal-widgets-lib/widgets/scalper-order-book/components/scalper-order-book-settings/constants/settings-defaults';
import {
  ClusterTimeframe,
  ScalperOrderBookWidgetSettings,
  TradesClusterPanelSettings
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {TradesCluster} from '@terminal-widgets-lib/widgets/scalper-order-book/types/trades-clusters.types';
import {InstrumentEqualityComparer} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';

/**
 * Поток кластеров сделок: история по HTTP + live обновления по подписке.
 * Порт логики данных trade-clusters-panel виджета scalper-order-book
 * (без DOM части - отрисовкой занимается pixi элемент).
 */
export class ClustersStreamBuilder {
  static buildClustersStream(
    settings$: Observable<ScalperOrderBookWidgetSettings>,
    tradeClustersService: TradeClustersService
  ): Observable<TradesCluster[]> {
    return settings$.pipe(
      map(settings => {
        if (settings.tradesClusterPanelSettings != null) {
          return settings;
        }

        return {
          ...settings,
          tradesClusterPanelSettings: {...TradesClusterPanelSettingsDefaults}
        };
      }),
      distinctUntilChanged((prev, curr) => {
        return InstrumentEqualityComparer.equals(prev, curr)
          && prev.tradesClusterPanelSettings?.timeframe === curr.tradesClusterPanelSettings?.timeframe
          && prev.tradesClusterPanelSettings?.displayIntervalsCount === curr.tradesClusterPanelSettings?.displayIntervalsCount;
      }),
      mapWith(
        s => tradeClustersService.getHistory(
          s,
          s.tradesClusterPanelSettings?.timeframe ?? TradesClusterPanelSettingsDefaults.timeframe,
          s.tradesClusterPanelSettings?.displayIntervalsCount ?? TradesClusterPanelSettingsDefaults.displayIntervalsCount,
        ),
        (settings, history) => ({settings, history})
      ),
      switchMap(x => this.getClusterUpdatesStream(x.settings, x.history ?? [], tradeClustersService))
    );
  }

  private static getClusterUpdatesStream(
    settings: ScalperOrderBookWidgetSettings,
    history: TradesCluster[],
    tradeClustersService: TradeClustersService
  ): Observable<TradesCluster[]> {
    const panelSettings = settings.tradesClusterPanelSettings!;

    const lastHistoryPoint = history.length > 0
      ? history[0].timestamp
      : getUnixTime(new Date());

    const updatesSubscription$ = tradeClustersService.getClustersSubscription(
      settings,
      panelSettings.timeframe,
      lastHistoryPoint
    ).pipe(
      startWith(null)
    );

    const state = [
      ...this.toDisplayClusters(history, panelSettings)
    ];

    return combineLatest([
      timer(0, Math.min(Math.floor((panelSettings.timeframe / 2) * 1000), 60 * 1000)),
      updatesSubscription$
    ]).pipe(
      map(([, updates]) => {
        if (updates == null) {
          return [...this.toDisplayClusters(state, panelSettings)];
        }

        const lastTimestamp = this.getPeriodStart(updates.timestamp, panelSettings.timeframe);
        const allClusters = [
          ...state.filter(s => s.timestamp !== lastTimestamp),
          {
            ...updates,
            timestamp: lastTimestamp
          }
        ];

        const updated = this.toDisplayClusters(allClusters, panelSettings);

        state.length = 0;
        state.push(...updated);

        return [...state];
      })
    );
  }

  private static toDisplayClusters(
    allClusters: TradesCluster[],
    settings: TradesClusterPanelSettings,
  ): TradesCluster[] {
    const intervalsToDisplay = this.getDisplayIntervals(
      settings.timeframe,
      settings.displayIntervalsCount
    );

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

  private static getDisplayIntervals(timeframe: ClusterTimeframe, displayIntervalsCount: number): number[] {
    const periodStart = this.getPeriodStart(getUnixTime(new Date()), timeframe);

    const intervals = [periodStart];
    for (let i = 1; i < displayIntervalsCount; i++) {
      const newInterval = Math.floor(intervals[i - 1] - timeframe);
      intervals.push(newInterval);
    }

    return intervals.reverse();
  }

  private static getPeriodStart(unixTime: number, timeframe: ClusterTimeframe): number {
    return Math.floor(Math.floor(unixTime / timeframe) * timeframe);
  }
}
