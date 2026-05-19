import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  forkJoin,
  Observable,
  of
} from 'rxjs';
import {
  map,
  switchMap
} from "rxjs/operators";
import {
  AsyncPipe,
  DecimalPipe,
  NgTemplateOutlet
} from "@angular/common";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {CandlesService} from '@terminal-core-lib/features/instruments/services/candles.service';
import {IndexDisplay} from '@terminal-widgets-lib/widgets/ribbon/types/ribbon.types';
import {withRefresh} from '@terminal-core-lib/common/utils/observable/with-refresh';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {ScrollableRow} from '@terminal-core-lib/features/scrollable-row/components/scrollable-row/scrollable-row';
import {ScrollableItem} from '@terminal-core-lib/features/scrollable-row/directives/scrollable-item';

export interface RibbonItem {
  displayName?: string;
  symbol: string;
  exchange: string;
  isFutures?: boolean;
}

@Component({
  selector: 'ats-ribbon',
  templateUrl: './ribbon.html',
  styleUrls: ['./ribbon.less'],
  imports: [
    NzTypographyComponent,
    AsyncPipe,
    DecimalPipe,
    NgTemplateOutlet,
    ScrollableRow,
    ScrollableItem
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class Ribbon implements OnInit {
  indices$!: Observable<IndexDisplay[]>;

  readonly layout = input<'singleRow' | '2row'>('singleRow');

  readonly showScrollButtons = input(true);

  readonly displayItems = input<RibbonItem[] | null>(null);

  private readonly candlesService = inject(CandlesService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly destroyRef = inject(DestroyRef);

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
    const displayItems = this.displayItems() ?? this.defaultIndices;
    this.indices$ = of(null).pipe(
      withRefresh(60000, this.applicationStatusService.isActive$),
      switchMap(() => {
        const indices = displayItems.map(i => {
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

        return forkJoin(indices);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private getQuoteInfo(instrumentKey: InstrumentKey): Observable<{ value: number, percentChange: number } | null> {
    return this.candlesService.getLastTwoDailyCandles(instrumentKey).pipe(
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
