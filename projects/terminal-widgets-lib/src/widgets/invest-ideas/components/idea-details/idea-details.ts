import {ChangeDetectionStrategy, Component, DestroyRef, inject, model, ViewEncapsulation} from '@angular/core';
import {LetDirective} from "@ngrx/component";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzModalComponent} from "ng-zorro-antd/modal";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {Observable, of, switchMap} from "rxjs";
import {map} from "rxjs/operators";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {createRefresh} from '@terminal-core-lib/common/utils/observable/create-refresh';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';
import {
  SubmitOrderForSymbol
} from '@terminal-widgets-lib/widgets/invest-ideas/components/submit-order-for-symbol/submit-order-for-symbol';
import {
  IdeaResponse,
  IdeaResponseFormat
} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas-service.types';
import {CandlesService} from '@terminal-core-lib/features/instruments/services/candles.service';
import {IdeaMetrics} from '@terminal-widgets-lib/widgets/invest-ideas/components/idea-metrics/idea-metrics';
import {ExpandableTextComponent} from '@terminal-core-lib/common/components/expandable-text/expandable-text';

interface InstrumentPrice {
  lastPrice: number;
  dayChangePercent: number;
}

@Component({
  selector: 'ats-idea-details',
  imports: [
    LetDirective,
    NzIconDirective,
    NzModalComponent,
    NzTypographyComponent,
    InstrumentIcon,
    SubmitOrderForSymbol,
    IdeaMetrics,
    ExpandableTextComponent
  ],
  templateUrl: './idea-details.html',
  styleUrl: './idea-details.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class IdeaDetails {
  readonly displayIdea = model<IdeaResponse | null>(null);
  readonly priceInfo$ = toObservable(this.displayIdea)
    .pipe(
      switchMap(idea => {
        if (idea == null || idea.format !== IdeaResponseFormat.StructuredJson) {
          return of(null);
        }

        return this.getPriceInfo({symbol: idea.ticker, exchange: idea.exchange});
      })
    );

  protected readonly IdeaResponseFormat = IdeaResponseFormat;
  private readonly candlesService = inject(CandlesService);
  private readonly applicationStatusService = inject(ApplicationStatusService);
  private readonly destroyRef = inject(DestroyRef);

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
