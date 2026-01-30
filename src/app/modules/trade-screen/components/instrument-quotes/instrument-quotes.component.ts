import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output
} from '@angular/core';
import {QuotesService} from "../../../../shared/services/quotes.service";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {toObservable} from "@angular/core/rxjs-interop";
import {switchMap} from "rxjs/operators";
import {ScrollableRowComponent} from "../../../../shared/components/scrollable-row/scrollable-row.component";
import {ScrollableItemDirective} from "../../../../shared/directives/scrollable-item.directive";
import {AsyncPipe, NgClass} from "@angular/common";
import {AtsPricePipe} from "../../../../shared/pipes/ats-price.pipe";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {filter} from "rxjs";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";

@Component({
  selector: 'ats-instrument-quotes',
  imports: [
    ScrollableRowComponent,
    ScrollableItemDirective,
    AsyncPipe,
    AtsPricePipe,
    NgClass
  ],
  templateUrl: './instrument-quotes.component.html',
  styleUrl: './instrument-quotes.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstrumentQuotesComponent {
  readonly targetInstrument = input.required<InstrumentKey>();

  readonly priceSelected = output<number>();

  private readonly quotesService = inject(QuotesService);

  protected quote$ = toObservable(this.targetInstrument).pipe(
    switchMap(instrument => this.quotesService.getQuotes(instrument.symbol, instrument.exchange, instrument.instrumentGroup))
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
