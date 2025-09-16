import {
  Component,
  computed,
  DestroyRef,
  model,
  OnDestroy
} from '@angular/core';
import {
  AsyncPipe,
  NgClass
} from "@angular/common";
import { InstrumentIconComponent } from "../../../../shared/components/instrument-icon/instrument-icon.component";
import { LetDirective } from "@ngrx/component";
import { NzIconDirective } from "ng-zorro-antd/icon";
import { NzModalComponent } from "ng-zorro-antd/modal";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import {
  Idea,
  IdeaSymbol
} from "../../services/invest-ideas-service-typings";
import {
  BehaviorSubject,
  Observable,
  switchMap,
  timer
} from "rxjs";
import { ArrayHelper } from "../../../../shared/utils/array-helper";
import { HistoryService } from "../../../../shared/services/history.service";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { map } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MathHelper } from "../../../../shared/utils/math-helper";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { SubmitOrderForSymbolComponent } from "../submit-order-for-symbol/submit-order-for-symbol.component";

interface InstrumentPrice {
  lastPrice: number;
  dayChangePercent: number;
}

@Component({
  selector: 'ats-idea-details',
  imports: [
    AsyncPipe,
    InstrumentIconComponent,
    LetDirective,
    NzIconDirective,
    NzModalComponent,
    NzTypographyComponent,
    NgClass,
    SubmitOrderForSymbolComponent
  ],
  templateUrl: './idea-details.component.html',
  styleUrl: './idea-details.component.less'
})
export class IdeaDetailsComponent implements OnDestroy {
  readonly displayIdea = model<Idea | null>(null);

  readonly selectedTicker$ = new BehaviorSubject<IdeaSymbol | null>(null);

  readonly sectionItems = computed(() => {
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

  constructor(
    private readonly historyService: HistoryService,
    private readonly instrumentsService: InstrumentsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

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
    return timer(0, 30_000).pipe(
      switchMap(() => this.historyService.getLastTwoCandles(instrumentKey)),
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
