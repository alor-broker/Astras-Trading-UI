import { Component, DestroyRef, LOCALE_ID, OnInit, inject, input } from '@angular/core';
import { AsyncPipe, formatNumber } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { TableConfig } from '../../../../shared/models/table-config.model';
import { BaseColumnSettings, FilterType } from '../../../../shared/models/settings/table-settings.model';
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

  ngOnInit(): void {
    this.anomalousVolumeService.watch(this.settings())
      .pipe(
        map((items: AnomalousVolumeItem[]) => [...items]),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((items: AnomalousVolumeItem[]) => {
        this.tableConfig$.next(this.createTableConfig(this.settings().anomalousVolumeColumns ?? []));
        this.tableData$.next(items);
        this.isLoading$.next(false);
        this.processSound(items);
      });
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
      { text: 'Продажа', value: 'sell' },
      { text: 'Нейтрально', value: 'neutral' }
    ];

    const allColumns: BaseColumnSettings<AnomalousVolumeItem>[] = [
      { id: 'ticker', displayName: 'Тикер', minWidth: 90 },
      { id: 'instrument', displayName: 'Инструмент', minWidth: 160 },
      {
        id: 'direction',
        displayName: 'Направление',
        minWidth: 110,
        transformFn: d => d.direction === 'buy' ? 'Покупка' : d.direction === 'sell' ? 'Продажа' : 'Нейтрально',
        classFn: d => `direction-${d.direction}`,
        filterData: {
          filterName: 'direction',
          filterType: FilterType.Default,
          filters: directionFilters
        }
      },
      { id: 'lots', displayName: 'Лоты', minWidth: 90, transformFn: d => formatNumber(d.lots, this.locale, '0.0-0') },
      {
        id: 'moneyVolume',
        displayName: 'Объём в деньгах',
        minWidth: 140,
        transformFn: d => formatNumber(d.moneyVolume, this.locale, '0.0-2')
      },
      {
        id: 'changePercent',
        displayName: 'Изменение %',
        minWidth: 120,
        transformFn: d => `${formatNumber(d.changePercent, this.locale, '0.0-2')}%`,
        classFn: d => d.changePercent >= 0 ? 'positive-color' : 'negative-color'
      },
      {
        id: 'buyPercent',
        displayName: 'Покупки %',
        minWidth: 120,
        transformFn: d => `${formatNumber(d.buyPercent, this.locale, '0.0-2')}%`
      },
      {
        id: 'sellPercent',
        displayName: 'Продажи %',
        minWidth: 120,
        transformFn: d => `${formatNumber(d.sellPercent, this.locale, '0.0-2')}%`
      },
      { id: 'date', displayName: 'Дата', minWidth: 120 },
      { id: 'time', displayName: 'Время выявления', minWidth: 120 }
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
}
