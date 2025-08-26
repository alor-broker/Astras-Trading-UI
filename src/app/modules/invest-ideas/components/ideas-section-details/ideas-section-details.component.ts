import {
  Component,
  computed,
  DestroyRef,
  model,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import { NzModalComponent } from "ng-zorro-antd/modal";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import {
  BehaviorSubject,
  Observable,
  switchMap,
  timer
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { map } from "rxjs/operators";
import { LetDirective } from "@ngrx/component";
import {
  AsyncPipe,
  NgClass
} from "@angular/common";
import { NzIconDirective } from "ng-zorro-antd/icon";
import { SubmitOrderForIdeaComponent } from "../submit-order-for-idea/submit-order-for-idea.component";
import {
  Idea,
  Section
} from "../../models/ideas-typings.model";
import { InstrumentIconComponent } from "../../../../shared/components/instrument-icon/instrument-icon.component";
import { OrderCommandsModule } from "../../../order-commands/order-commands.module";
import { InstrumentEqualityComparer } from "../../../../shared/utils/instruments";
import { ArrayHelper } from "../../../../shared/utils/array-helper";
import { HistoryService } from "../../../../shared/services/history.service";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { MathHelper } from "../../../../shared/utils/math-helper";

interface InstrumentPrice {
  lastPrice: number;
  dayChangePercent: number;
}

@Component({
  selector: 'ats-ideas-section-details',
  imports: [
    NzModalComponent,
    InstrumentIconComponent,
    NzTypographyComponent,
    LetDirective,
    NgClass,
    NzIconDirective,
    OrderCommandsModule,
    SubmitOrderForIdeaComponent,
    AsyncPipe
  ],
  templateUrl: './ideas-section-details.component.html',
  styleUrl: './ideas-section-details.component.less',
  encapsulation: ViewEncapsulation.None
})
export class IdeasSectionDetailsComponent implements OnDestroy {
  readonly displaySection = model<Section | null>(null);

  readonly selectedIdea$ = new BehaviorSubject<Idea | null>(null);

  readonly sectionItems = computed(() => {
    const section = this.displaySection();
    if (section == null) {
      return [];
    }

    this.selectedIdea$.next(ArrayHelper.firstOrNull(section.ideas));
    return section.ideas.map(i => ({
      ...i,
      priceInfo$: this.getPriceInfo(i.instrumentKey)
    }));
  });

  readonly isInstrumentsEquals = InstrumentEqualityComparer.equals;

  constructor(
    private readonly historyService: HistoryService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnDestroy(): void {
    this.selectedIdea$.complete();
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
