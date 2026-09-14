import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {CandlesService} from '@terminal-core-lib/features/instruments/services/candles.service';
import {IndexDisplay} from '@terminal-widgets-lib/widgets/ribbon/types/ribbon.types';
import {withRefresh} from '@terminal-core-lib/common/utils/observable/with-refresh';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {ScrollableRow} from '@terminal-core-lib/features/scrollable-row/components/scrollable-row/scrollable-row';
import {ScrollableItem} from '@terminal-core-lib/features/scrollable-row/directives/scrollable-item';

import {DEFAULT_RIBBON_ITEMS, RIBBON_REFRESH_INTERVAL, RibbonItem} from '../../widget-settings.types';

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

  readonly refreshIntervalSec = input<number>(RIBBON_REFRESH_INTERVAL.defaultValue);

  private readonly refreshConfig$ = toObservable(computed(() => {
    const interval = this.refreshIntervalSec();
    return {
      items: this.displayItems() ?? DEFAULT_RIBBON_ITEMS,
      intervalMs: (Number.isFinite(interval)
        ? Math.min(RIBBON_REFRESH_INTERVAL.max, Math.max(RIBBON_REFRESH_INTERVAL.min, interval))
        : RIBBON_REFRESH_INTERVAL.defaultValue) * 1000
    };
  }));

  ngOnInit(): void {
    this.indices$ = this.refreshConfig$.pipe(
      switchMap(config => of(config.items).pipe(withRefresh(config.intervalMs, this.applicationStatusService.isActive$))),
      switchMap(displayItems => {
        const indices = displayItems.map(i => {
          const displayName = i.displayName?.trim() ?? '';
          return this.getQuoteInfo(
            {
              symbol: (i.isFutures ?? false) ? this.getNextFuturesContract(i.symbol) : i.symbol,
              exchange: i.exchange
            }
          ).pipe(
            map(x => ({
              name: displayName.length > 0 ? displayName : i.symbol,
              value: x?.value ?? 0,
              changePercent: x?.percentChange ?? 0
            } as IndexDisplay))
          );
        });

        return indices.length > 0 ? forkJoin(indices) : of([]);
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
