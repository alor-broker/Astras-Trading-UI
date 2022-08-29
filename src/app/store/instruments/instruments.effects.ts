import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { InstrumentsService } from 'src/app/modules/instruments/services/instruments.service';
import { filter, map } from 'rxjs/operators';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import {
  newInstrumentByBadgeSelected,
  selectNewInstrumentByBadge,
} from './instruments.actions';
import { ErrorHandlerService } from 'src/app/shared/services/handle-error/error-handler.service';
import { catchHttpError, mapWith } from 'src/app/shared/utils/observable-helper';
import { defaultBadgeColor } from "../../shared/utils/instruments";

@Injectable()
export class InstrumentsEffects {
  selectInstrumentByBadge$ = createEffect(() =>
    this.actions$.pipe(
      ofType(selectNewInstrumentByBadge),
      mapWith(
        action => this.instrumentsService.getInstrument(action.instrument)
          .pipe(catchHttpError<Instrument | null>(null, this.errorHandlerService)),
        (action, instrument) => ({badgeColor: action.badgeColor || defaultBadgeColor, instrument})
      ),
      filter(({instrument}) => !!instrument),
      map(({instrument, badgeColor}) => newInstrumentByBadgeSelected({instrument: instrument!, badgeColor}))
    )
  );

  constructor(
    private readonly actions$: Actions,
    private readonly instrumentsService: InstrumentsService,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
  }
}
