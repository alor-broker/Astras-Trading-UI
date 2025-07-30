import {
  Component,
  computed,
  DestroyRef,
  model,
  output
} from '@angular/core';
import { Section } from "../../models/ideas-typings.model";
import {
  NzModalComponent,
  NzModalContentDirective
} from "ng-zorro-antd/modal";
import { InstrumentIconComponent } from "../../../../shared/components/instrument-icon/instrument-icon.component";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import { HistoryService } from "../../../../shared/services/history.service";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import {
  Observable,
  switchMap,
  timer
} from "rxjs";
import { MathHelper } from "../../../../shared/utils/math-helper";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { map } from "rxjs/operators";
import { LetDirective } from "@ngrx/component";
import { NgClass } from "@angular/common";
import { NzIconDirective } from "ng-zorro-antd/icon";

interface InstrumentPrice {
  lastPrice: number;
  dayChangePercent: number;
}

@Component({
  selector: 'ats-ideas-section-details',
  imports: [
    NzModalComponent,
    NzModalContentDirective,
    InstrumentIconComponent,
    NzTypographyComponent,
    LetDirective,
    NgClass,
    NzIconDirective
  ],
  templateUrl: './ideas-section-details.component.html',
  styleUrl: './ideas-section-details.component.less'
})
export class IdeasSectionDetailsComponent {
  readonly displaySection = model<Section | null>(null);

  readonly sectionItems = computed(() => {
    const section = this.displaySection();
    if (section == null) {
      return [];
    }

    return section.ideas.map(i => ({
      ...i,
      priceInfo$: this.getPriceInfo(i.instrumentKey)
    }));
  });

  readonly instrumentSelected = output<InstrumentKey>();

  constructor(
    private readonly historyService: HistoryService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  protected close(): void {
    this.displaySection.set(null);
  }

  private getPriceInfo(instrumentKey: InstrumentKey): Observable<InstrumentPrice | null> {
    return timer(0, 10_000).pipe(
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
