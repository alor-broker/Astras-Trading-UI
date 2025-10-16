import {
  Component,
  computed,
  DestroyRef,
  model,
  output,
  ViewEncapsulation
} from '@angular/core';
import { NgClass } from "@angular/common";
import { InstrumentIconComponent } from "../../../../shared/components/instrument-icon/instrument-icon.component";
import { LetDirective } from "@ngrx/component";
import { NzModalComponent } from "ng-zorro-antd/modal";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import { Idea } from "../../services/invest-ideas-service-typings";
import {
  Observable,
  switchMap,
  timer
} from "rxjs";
import { HistoryService } from "../../../../shared/services/history.service";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { map } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MathHelper } from "../../../../shared/utils/math-helper";

interface InstrumentPrice {
  lastPrice: number;
  dayChangePercent: number;
}

@Component({
  selector: 'ats-invest-ideas-details-dialog',
  imports: [
    InstrumentIconComponent,
    LetDirective,
    NzModalComponent,
    NzTypographyComponent,
    NgClass
  ],
  templateUrl: './invest-ideas-details-dialog.component.html',
  styleUrl: './invest-ideas-details-dialog.component.less',
  encapsulation: ViewEncapsulation.None
})
export class InvestIdeasDetailsDialogComponent {
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

  constructor(
    private readonly historyService: HistoryService,
    private readonly destroyRef: DestroyRef
  ) {
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
