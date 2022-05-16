import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { InstrumentsService } from 'src/app/modules/instruments/services/instruments.service';
import { mergeMap, map, filter } from 'rxjs/operators';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import {
  selectNewInstrument,
  newInstrumentSelected,
} from './instruments.actions';
import { ErrorHandlerService } from 'src/app/shared/services/handle-error/error-handler.service';
import { catchHttpError } from 'src/app/shared/utils/observable-helper';

@Injectable()
export class InstrumentsEffects {
  constructor(
    private actions$: Actions,
    private instrumentsService: InstrumentsService,
    private errorHandlerService: ErrorHandlerService
  ) {}

  loadInstruments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(selectNewInstrument),
      mergeMap((action) => this.instrumentsService.getInstrument(action.instrument)),
      catchHttpError<Instrument | null>(null, this.errorHandlerService),
      filter((instrument): instrument is Instrument => !!instrument),
      map((instrument) => newInstrumentSelected({ instrument }))
    )
  );
}
