import { Component, DestroyRef, input, OnInit, inject } from '@angular/core';
import {
  forkJoin,
  Observable,
  timer
} from 'rxjs';
import { IndexDisplay } from '../../models/ribbon-display.model';
import {
  map,
  switchMap
} from "rxjs/operators";
import { HistoryService } from "../../../../shared/services/history.service";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { MathHelper } from "../../../../shared/utils/math-helper";
import { ScrollableRowComponent } from "../../../../shared/components/scrollable-row/scrollable-row.component";
import { AsyncPipe, DecimalPipe, NgClass, NgTemplateOutlet } from "@angular/common";
import { ScrollableItemDirective } from "../../../../shared/directives/scrollable-item.directive";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

export interface RibbonItem {
  displayName?: string;
  symbol: string;
  exchange: string;
  isFutures?: boolean;
}

@Component({
  selector: 'ats-ribbon',
  templateUrl: './ribbon.component.html',
  styleUrls: ['./ribbon.component.less'],
  imports: [
    ScrollableRowComponent,
    ScrollableItemDirective,
    NzTypographyComponent,
    AsyncPipe,
    DecimalPipe,
    NgClass,
    NgTemplateOutlet
],
  standalone: true
})
export class RibbonComponent implements OnInit {
  private readonly historyService = inject(HistoryService);
  private readonly destroyRef = inject(DestroyRef);

  indices$!: Observable<IndexDisplay[]>;

  readonly layout = input<'singleRow' | '2row'>('singleRow');

  readonly showScrollButtons = input(true);

  readonly displayItems = input<RibbonItem[] | null>(null);

  private readonly defaultIndices: RibbonItem[] = [
    {
      symbol: 'IMOEX',
      exchange: 'MOEX'
    },
    {
      symbol: 'RTSI',
      exchange: 'MOEX'
    },
    {
      displayName: 'USD/РУБ',
      symbol: 'USD000UTSTOM',
      exchange: 'MOEX'
    },
    {
      displayName: 'CNY/РУБ',
      symbol: 'CNYRUB_TOM',
      exchange: 'MOEX'
    },
    {
      displayName: 'Oil (Brent)',
      symbol: 'BR',
      exchange: 'MOEX',
      isFutures: true
    },
    {
      displayName: 'Gold',
      symbol: 'GOLD',
      isFutures: true,
      exchange: 'MOEX'
    }
  ];

  ngOnInit(): void {
    this.indices$ = timer(0, 60000).pipe(
      switchMap(() => {
        const displayItems = this.displayItems() ?? this.defaultIndices;
        const indices$ = displayItems.map(i => {
          return this.getQuoteInfo(
            {
              symbol: (i.isFutures ?? false) ? this.getNextFuturesContract(i.symbol) : i.symbol,
              exchange: i.exchange
            }
          ).pipe(
            map(x => ({
              name: i.displayName ?? i.symbol,
              value: x?.value ?? 0,
              changePercent: x?.percentChange ?? 0
            } as IndexDisplay))
          );
        });

        return forkJoin(indices$);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private getQuoteInfo(instrumentKey: InstrumentKey): Observable<{ value: number, percentChange: number } | null> {
    return this.historyService.getLastTwoCandles(instrumentKey).pipe(
      map(candles => {
        if (!candles) {
          return null;
        }

        return {
          value: candles.cur.close,
          percentChange: this.getDayChangePerPrice(candles.cur.close, candles.prev.close)
        };
      })
    );
  }

  private getDayChangePerPrice(lastPrice?: number, closePrice?: number): number {
    if (lastPrice == null || closePrice == null) {
      return 0;
    }
    return MathHelper.round((1 - (closePrice / lastPrice)) * 100, 2);
  }

  private getNextFuturesContract(prefix: string): string {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    let nextMonth;
    let nextYear;

    if (currentMonth >= 1 && currentMonth < 3) {
      nextMonth = 3;
      nextYear = currentYear;
    } else if (currentMonth >= 3 && currentMonth < 6) {
      nextMonth = 6;
      nextYear = currentYear;
    } else if (currentMonth >= 6 && currentMonth < 9) {
      nextMonth = 9;
      nextYear = currentYear;
    } else if (currentMonth >= 9) {
      nextMonth = 12;
      nextYear = currentYear;
    } else {
      nextMonth = 3;
      nextYear = currentYear + 1;
    }

    return `${prefix}-${nextMonth}.${nextYear.toString().slice(2)}`;
  }
}
