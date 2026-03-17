import { Component, DestroyRef, LOCALE_ID, OnInit, inject, input } from '@angular/core';
import { AsyncPipe, formatNumber } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { TableConfig } from '../../../../shared/models/table-config.model';
import {
  BaseColumnSettings,
  DefaultTableFilters,
  FilterType
} from '../../../../shared/models/settings/table-settings.model';
import { AnomalousVolumeItem } from '../../models/anomalous-volume-item.model';
import { AnomalousVolumeService } from '../../services/anomalous-volume.service';
import { AnomalousVolumeSettings } from '../../models/anomalous-volume-settings.model';
import {
  InfiniteScrollTableComponent
} from '../../../../shared/components/infinite-scroll-table/infinite-scroll-table.component';
import { NzResizeObserverDirective } from 'ng-zorro-antd/cdk/resize-observer';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'ats-anomalous-volume',
  templateUrl: './anomalous-volume.component.html',
  styleUrl: './anomalous-volume.component.less',
  imports: [
    InfiniteScrollTableComponent,
    NzResizeObserverDirective,
    AsyncPipe
  ]
})
export class AnomalousVolumeComponent implements OnInit {
  private readonly anomalousVolumeService = inject(AnomalousVolumeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = inject(LOCALE_ID);

  readonly settings = input.required<AnomalousVolumeSettings>();

  readonly tableConfig$ = new BehaviorSubject<TableConfig<AnomalousVolumeItem>>(this.createTableConfig([]));
  readonly tableData$ = new BehaviorSubject<AnomalousVolumeItem[]>([]);
  readonly isLoading$ = new BehaviorSubject<boolean>(true);
  readonly contentSize$ = new BehaviorSubject<{ width: number, height: number }>({ width: 0, height: 0 });
  private readonly sourceItems$ = new BehaviorSubject<AnomalousVolumeItem[]>([]);
  private activeDirectionFilter: 'buy' | 'sell' | null = null;
  private activeSortColumnId = 'time';
  private activeSortDirection: string | null = 'descend';

  ngOnInit(): void {
    this.anomalousVolumeService.watch(this.settings())
      .pipe(
        map((items: AnomalousVolumeItem[]) => [...items]),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((items: AnomalousVolumeItem[]) => {
        this.tableConfig$.next(this.createTableConfig(this.settings().anomalousVolumeColumns ?? []));
        this.sourceItems$.next(items);
        this.applyLocalFilter();
        this.isLoading$.next(false);
        this.processSound(this.sourceItems$.value);
      });
  }

  applyFilter(filters: DefaultTableFilters): void {
    const rawDirection = filters['direction'];

    if (Array.isArray(rawDirection)) {
      const selected = rawDirection.find(v => v === 'buy' || v === 'sell');
      this.activeDirectionFilter = (selected ?? null) as 'buy' | 'sell' | null;
    } else if (rawDirection === 'buy' || rawDirection === 'sell') {
      this.activeDirectionFilter = rawDirection;
    } else if (typeof rawDirection === 'string') {
      const selected = rawDirection
        .split(';')
        .map(x => x.trim())
        .find(v => v === 'buy' || v === 'sell');
      this.activeDirectionFilter = (selected ?? null) as 'buy' | 'sell' | null;
    } else {
      this.activeDirectionFilter = null;
    }

    this.applyLocalFilter();
  }

  containerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  private processSound(items: AnomalousVolumeItem[]): void {
    if (!this.settings().soundAlertEnabled || items.length === 0) {
      return;
    }

    const newest = items[0];
    const now = Date.now();
    if (Math.abs(now - newest.detectedAt) > 2000) {
      return;
    }

    this.playBeep();
  }

  private playBeep(): void {
    type AudioContextConstructor = new () => AudioContext;
    type WindowWithWebkitAudioContext = Window & {
      AudioContext?: AudioContextConstructor;
      webkitAudioContext?: AudioContextConstructor;
    };

    const targetWindow = window as WindowWithWebkitAudioContext;
    const audioContextConstructor = targetWindow.AudioContext ?? targetWindow.webkitAudioContext;
    if (audioContextConstructor == null) {
      return;
    }

    const ctx = new audioContextConstructor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.03;

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.12);

    setTimeout(() => {
      void ctx.close();
    }, 200);
  }

  private createTableConfig(selectedColumns: string[]): TableConfig<AnomalousVolumeItem> {
    const directionFilters = [
      { text: 'Покупка', value: 'buy' },
      { text: 'Продажа', value: 'sell' }
    ];

    const allColumns: BaseColumnSettings<AnomalousVolumeItem>[] = [
      {
        id: 'eventType',
        displayName: 'Тип события',
        minWidth: 140,
        transformFn: d => d.eventType === 'large-trade' ? 'Крупная сделка' : 'Аномальный объём',
        sortOrder: this.getColumnSortOrder('eventType'),
        sortChangeFn: (direction): void => this.updateSorting('eventType', direction),
        sortFn: (a, b): number => a.eventType.localeCompare(b.eventType)
      },
      {
        id: 'ticker',
        displayName: 'Тикер',
        minWidth: 90,
        sortOrder: this.getColumnSortOrder('ticker'),
        sortChangeFn: (direction): void => this.updateSorting('ticker', direction),
        sortFn: (a, b): number => a.ticker.localeCompare(b.ticker)
      },
      {
        id: 'instrument',
        displayName: 'Инструмент',
        minWidth: 160,
        sortOrder: this.getColumnSortOrder('instrument'),
        sortChangeFn: (direction): void => this.updateSorting('instrument', direction),
        sortFn: (a, b): number => a.instrument.localeCompare(b.instrument)
      },
      {
        id: 'direction',
        displayName: 'Направление',
        minWidth: 110,
        transformFn: d => d.direction === 'buy' ? 'Покупка' : 'Продажа',
        classFn: d => `direction-${d.direction}`,
        filterData: {
          filterName: 'direction',
          filterType: FilterType.Default,
          filters: directionFilters
        }
      },
      {
        id: 'lots',
        displayName: 'Лоты',
        minWidth: 90,
        transformFn: d => formatNumber(d.lots, this.locale, '0.0-0'),
        sortOrder: this.getColumnSortOrder('lots'),
        sortChangeFn: (direction): void => this.updateSorting('lots', direction),
        sortFn: (a, b): number => a.lots - b.lots
      },
      {
        id: 'moneyVolume',
        displayName: 'Объем',
        minWidth: 140,
        transformFn: d => this.formatMoneyVolume(d.moneyVolume),
        classFn: d => d.direction === 'buy' ? 'buy-color' : d.direction === 'sell' ? 'sell-color' : '',
        sortOrder: this.getColumnSortOrder('moneyVolume'),
        sortChangeFn: (direction): void => this.updateSorting('moneyVolume', direction),
        sortFn: (a, b): number => a.moneyVolume - b.moneyVolume
      },
      {
        id: 'changePercent',
        displayName: 'Изменение %',
        minWidth: 120,
        transformFn: d => `${formatNumber(d.changePercent, this.locale, '0.0-2')}%`,
        classFn: d => d.changePercent > 0 ? 'positive-color' : d.changePercent < 0 ? 'negative-color' : '',
        sortOrder: this.getColumnSortOrder('changePercent'),
        sortChangeFn: (direction): void => this.updateSorting('changePercent', direction),
        sortFn: (a, b): number => a.changePercent - b.changePercent
      },
      {
        id: 'buyPercent',
        displayName: 'Покупки %',
        minWidth: 120,
        transformFn: d => `${formatNumber(d.buyPercent, this.locale, '0.0-2')}%`,
        sortOrder: this.getColumnSortOrder('buyPercent'),
        sortChangeFn: (direction): void => this.updateSorting('buyPercent', direction),
        sortFn: (a, b): number => a.buyPercent - b.buyPercent
      },
      {
        id: 'sellPercent',
        displayName: 'Продажи %',
        minWidth: 120,
        transformFn: d => `${formatNumber(d.sellPercent, this.locale, '0.0-2')}%`,
        sortOrder: this.getColumnSortOrder('sellPercent'),
        sortChangeFn: (direction): void => this.updateSorting('sellPercent', direction),
        sortFn: (a, b): number => a.sellPercent - b.sellPercent
      },
      {
        id: 'date',
        displayName: 'Дата',
        minWidth: 120,
        sortOrder: this.getColumnSortOrder('date'),
        sortChangeFn: (direction): void => this.updateSorting('date', direction),
        sortFn: (a, b): number => a.detectedAt - b.detectedAt
      },
      {
        id: 'time',
        displayName: 'Время',
        minWidth: 120,
        sortOrder: this.getColumnSortOrder('time'),
        sortChangeFn: (direction): void => this.updateSorting('time', direction),
        sortFn: (a, b): number => a.detectedAt - b.detectedAt
      },
    ];

    const normalizedSelection = selectedColumns.length > 0
      ? selectedColumns
      : allColumns.map(c => c.id);

    const columns = allColumns
      .filter(c => normalizedSelection.includes(c.id))
      .map((c, idx) => ({
        ...c,
        order: idx
      }));

    return {
      columns,
      rowConfig: {
        rowClass: (row): string | null => row.direction === 'buy'
          ? 'buy-row'
          : row.direction === 'sell'
            ? 'sell-row'
            : null
      }
    };
  }

  private applyLocalFilter(): void {
    const data = this.sourceItems$.value;

    if (this.activeDirectionFilter == null) {
      this.tableData$.next(this.applySorting(data));
      return;
    }

    this.tableData$.next(this.applySorting(data.filter(x => x.direction === this.activeDirectionFilter)));
  }

  private updateSorting(columnId: string, direction: string | null): void {
    this.activeSortColumnId = direction == null ? '' : columnId;
    this.activeSortDirection = direction;
    this.tableConfig$.next(this.createTableConfig(this.settings().anomalousVolumeColumns ?? []));
    this.applyLocalFilter();
  }

  private getColumnSortOrder(columnId: string): string | null {
    if (this.activeSortColumnId !== columnId) {
      return null;
    }

    return this.activeSortDirection;
  }

  private applySorting(items: AnomalousVolumeItem[]): AnomalousVolumeItem[] {
    const sorted = [...items];

    if (this.activeSortDirection == null) {
      return sorted;
    }

    const directionFactor = this.activeSortDirection === 'ascend' ? 1 : -1;
    const comparator = this.getComparatorByColumnId(this.activeSortColumnId);
    if (comparator == null) {
      return sorted;
    }

    return sorted.sort((a, b) => comparator(a, b) * directionFactor);
  }

  private getComparatorByColumnId(columnId: string): ((a: AnomalousVolumeItem, b: AnomalousVolumeItem) => number) | null {
    switch (columnId) {
      case 'eventType':
        return (a, b): number => a.eventType.localeCompare(b.eventType);
      case 'ticker':
        return (a, b): number => a.ticker.localeCompare(b.ticker);
      case 'instrument':
        return (a, b): number => a.instrument.localeCompare(b.instrument);
      case 'lots':
        return (a, b): number => a.lots - b.lots;
      case 'moneyVolume':
        return (a, b): number => a.moneyVolume - b.moneyVolume;
      case 'changePercent':
        return (a, b): number => a.changePercent - b.changePercent;
      case 'buyPercent':
        return (a, b): number => a.buyPercent - b.buyPercent;
      case 'sellPercent':
        return (a, b): number => a.sellPercent - b.sellPercent;
      case 'date':
      case 'time':
        return (a, b): number => a.detectedAt - b.detectedAt;
      default:
        return null;
    }
  }

  private formatMoneyVolume(value: number): string {
    if (value < 1_000_000) {
      return `${formatNumber(Math.round(value / 1_000), this.locale, '0.0-0')}K`;
    }

    return `${formatNumber(Math.round(value / 1_000_000), this.locale, '0.0-0')}M`;
  }
}
