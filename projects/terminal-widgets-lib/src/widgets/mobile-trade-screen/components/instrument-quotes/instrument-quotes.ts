import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import {toObservable} from "@angular/core/rxjs-interop";
import {switchMap} from "rxjs/operators";
import {AsyncPipe} from "@angular/common";
import {filter} from "rxjs";
import {
  Instrument,
  InstrumentKey
} from '@terminal-core-lib/common/types/instrument.types';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {ScrollableRow} from '@terminal-core-lib/features/scrollable-row/components/scrollable-row/scrollable-row';
import {ScrollableItem} from '@terminal-core-lib/features/scrollable-row/directives/scrollable-item';
import {AtsPrice} from '@terminal-core-lib/common/pipes/price';

@Component({
  selector: 'ats-instrument-quotes',
  imports: [
    AsyncPipe,
    ScrollableRow,
    ScrollableItem,
    AtsPrice
  ],
  templateUrl: './instrument-quotes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InstrumentQuotes {
  readonly targetInstrument = input.required<InstrumentKey>();

  readonly priceSelected = output<number>();

  private readonly quotesService = inject(QuotesService);

  protected quote$ = toObservable(this.targetInstrument).pipe(
    switchMap(instrument => this.quotesService.getQuotesSubscription(instrument.symbol, instrument.exchange, instrument.instrumentGroup))
  );

  private readonly instrumentsService = inject(InstrumentsService);

  protected instrumentInfo$ = toObservable(this.targetInstrument).pipe(
    switchMap(instrument => this.instrumentsService.getInstrument(instrument)),
    filter(i => i != null)
  );

  protected getPriceDecimalSymbolsCount(targetInstrument: Instrument): number {
    return MathHelper.getPrecision(targetInstrument.minstep ?? 1);
  }
}
