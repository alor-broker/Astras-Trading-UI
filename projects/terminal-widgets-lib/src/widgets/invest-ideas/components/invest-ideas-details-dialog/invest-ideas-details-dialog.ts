import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  model,
  output,
  ViewEncapsulation
} from '@angular/core';

import {LetDirective} from "@ngrx/component";
import {NzModalComponent} from "ng-zorro-antd/modal";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {
  Observable,
  switchMap
} from "rxjs";
import {map} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {Idea} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas-service.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {CandlesService} from '@terminal-core-lib/features/instruments/services/candles.service';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {createRefresh} from '@terminal-core-lib/common/utils/observable/create-refresh';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';

interface InstrumentPrice {
  lastPrice: number;
  dayChangePercent: number;
}

@Component({
  selector: 'ats-invest-ideas-details-dialog',
  imports: [
    LetDirective,
    NzModalComponent,
    NzTypographyComponent,
    InstrumentIcon
  ],
  templateUrl: './invest-ideas-details-dialog.html',
  styleUrl: './invest-ideas-details-dialog.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InvestIdeasDetailsDialog {
  readonly displayIdea = model<Idea | null>(null);

  readonly ideaSymbols = computed(() => {
    const idea = this.displayIdea();
    if (idea == null) {
      return [];
    }

    return idea.symbols.map(i => ({
      ...i,
      priceInfo$: this.getPriceInfo({symbol: i.ticker, exchange: i.exchange})
    }));
  });

  readonly symbolSelected = output<InstrumentKey>();

  private readonly candlesService = inject(CandlesService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly destroyRef = inject(DestroyRef);

  protected close(): void {
    this.displayIdea.set(null);
  }

  private getPriceInfo(instrumentKey: InstrumentKey): Observable<InstrumentPrice | null> {
    return createRefresh(30_000, this.applicationStatusService.isActive$).pipe(
      switchMap(() => this.candlesService.getLastTwoDailyCandles(instrumentKey)),
      map(r => {
        if (r == null || (r.cur == null && r.prev == null)) {
          return null;
        }

        return {
          lastPrice: r.cur.close ?? r.prev.close,
          dayChangePercent: this.getDayPercentChange(r.cur.close, r.prev.close)
        };
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private getDayPercentChange(lastPrice?: number, closePrice?: number): number {
    if (lastPrice == null || closePrice == null) {
      return 0;
    }
    return MathHelper.round((1 - (closePrice / lastPrice)) * 100, 2);
  }
}
