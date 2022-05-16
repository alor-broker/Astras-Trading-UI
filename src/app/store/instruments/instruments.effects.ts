import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { InstrumentsService } from 'src/app/modules/instruments/services/instruments.service';
import { mergeMap, map, tap } from 'rxjs/operators';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { newInstrumentSelectedName, selectNewInstrumentName } from './instruments.actions';
import { ErrorHandlerService } from 'src/app/shared/services/handle-error/error-handler.service';
import { catchHttpError } from 'src/app/shared/utils/observable-helper';

@Injectable()
export class InstrumentsEffects {
  constructor(
    private actions$: Actions,
    private instrumentsService: InstrumentsService,
    private errorHandlerService: ErrorHandlerService
  ) {}

  private instrument: Instrument | null = null;

  loadInstruments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(selectNewInstrumentName),
      mergeMap((action: { instrument: Instrument }) => this.instrumentsService.getInstrument(action.instrument)),
      tap(instrument => this.instrument = instrument),
      map((instrument) => ({
        type: newInstrumentSelectedName,
        instrument: instrument,
      })),
      catchHttpError({
        type: newInstrumentSelectedName,
        instrument: this.instrument
      }, this.errorHandlerService)
    )
  );
}
