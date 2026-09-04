import {inject, Injectable} from '@angular/core';
import {distinctUntilChanged, exhaustMap, filter, map, Observable, of, startWith, switchMap, timer} from 'rxjs';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {SignalDetailsViewModel, SignalRowViewModel} from '../types/ai-signals-view.types';
import {AiSignalsViewModelHelper} from '../utils/ai-signals-view-model.helper';

@Injectable()
export class SignalDetailsService {
  private readonly quotesService = inject(QuotesService);

  getDetails(rows$: Observable<SignalRowViewModel | null>): Observable<SignalDetailsViewModel | null> {
    return rows$.pipe(
      switchMap(row => {
        const details = row == null ? null : AiSignalsViewModelHelper.toDetailsViewModel(row);
        if (row == null || details == null) {
          return of(null);
        }

        if (row.exchange == null) {
          return of(details);
        }

        const instrumentKey = InstrumentKeyHelper.toInstrumentKey({symbol: row.ticker, exchange: row.exchange});

        return timer(0, 60_000).pipe(
          exhaustMap(() => this.quotesService.getLastPrice(instrumentKey)),
          // QuotesService normalizes HTTP failures to null. Keep the last valid price on failure.
          filter((price): price is number => price != null && Number.isFinite(price) && price > 0),
          startWith(row.currentPrice),
          distinctUntilChanged(),
          map(currentPrice => currentPrice === details.currentPrice
            ? details
            : {
            ...details,
            currentPrice,
            analysts: details.analysts.map(analyst => ({...analyst, currentPrice}))
          })
        );
      })
    );
  }
}
