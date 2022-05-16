import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { InstrumentsService } from 'src/app/modules/instruments/services/instruments.service';
import { mergeMap, map } from 'rxjs/operators';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';

@Injectable()
export class InstrumentsEffects {
  constructor(
    private actions$: Actions,
    private instrumentsService: InstrumentsService
  ) {}

  loadMovies$ = createEffect(() =>
    this.actions$.pipe(
      ofType('[Instruments] SelectNewInstrument'),
      mergeMap((action: { instrument: Instrument }) => {
        return this.instrumentsService
          .getInstrument(action.instrument)
          .pipe(
            map((instrument) => ({
              type: '[Instruments] NewInstrumentSelected',
              instrument: instrument,
            }))
          );
      })
    )
  );
}
