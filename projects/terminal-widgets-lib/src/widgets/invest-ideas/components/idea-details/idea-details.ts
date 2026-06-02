import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  model,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import {AsyncPipe} from "@angular/common";
import {LetDirective} from "@ngrx/component";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzModalComponent} from "ng-zorro-antd/modal";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {
  BehaviorSubject,
  Observable,
  switchMap
} from "rxjs";
import {map} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {CandlesService} from '@terminal-core-lib/features/instruments/services/candles.service';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {
  Idea,
  IdeaSymbol
} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas-service.types';
import {ArrayHelper} from '@terminal-core-lib/common/utils/array.helper';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {createRefresh} from '@terminal-core-lib/common/utils/observable/create-refresh';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';
import {SubmitOrderForSymbol} from '@terminal-widgets-lib/widgets/invest-ideas/components/submit-order-for-symbol/submit-order-for-symbol';

interface InstrumentPrice {
  lastPrice: number;
  dayChangePercent: number;
}

@Component({
  selector: 'ats-idea-details',
  imports: [
    AsyncPipe,
    LetDirective,
    NzIconDirective,
    NzModalComponent,
    NzTypographyComponent,
    InstrumentIcon,
    SubmitOrderForSymbol
  ],
  templateUrl: './idea-details.html',
  styleUrl: './idea-details.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class IdeaDetails implements OnDestroy {
  readonly displayIdea = model<Idea | null>(null);

  readonly selectedTicker$ = new BehaviorSubject<IdeaSymbol | null>(null);

  private readonly candlesService = inject(CandlesService);

  private readonly instrumentsService = inject(InstrumentsService);

  readonly ideaSymbols = computed(() => {
    const idea = this.displayIdea();
    if (idea == null) {
      return [];
    }

    this.selectedTicker$.next(ArrayHelper.firstOrNull(idea.symbols));
    return idea.symbols.map(i => ({
      ...i,
      instrument$: this.instrumentsService.getInstrument({symbol: i.ticker, exchange: i.exchange}),
      priceInfo$: this.getPriceInfo({symbol: i.ticker, exchange: i.exchange})
    }));
  });

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly destroyRef = inject(DestroyRef);

  isTickerEquals(a: IdeaSymbol | null, b: IdeaSymbol | null): boolean {
    return a?.ticker === b?.ticker
      && a?.exchange === b?.exchange;
  };

  ngOnDestroy(): void {
    this.selectedTicker$.complete();
  }

  protected close(): void {
    this.displayIdea.set(null);
  }

  private getPriceInfo(instrumentKey: InstrumentKey): Observable<InstrumentPrice | null> {
    return createRefresh(30_000, this.applicationStatusService.isActive$)
      .pipe(
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
