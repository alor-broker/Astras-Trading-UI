import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { InstrumentsService } from 'src/app/modules/instruments/services/instruments.service';
import { filter, map, tap } from 'rxjs/operators';
import { Instrument, InstrumentBadges } from 'src/app/shared/models/instruments/instrument.model';
import {
  initInstrumentsWithBadges,
  initInstrumentsWithBadgesSuccess,
  newInstrumentByBadgeSelected, saveInstruments,
  selectNewInstrumentByBadge,
} from './instruments.actions';
import { ErrorHandlerService } from 'src/app/shared/services/handle-error/error-handler.service';
import { catchHttpError, mapWith } from 'src/app/shared/utils/observable-helper';
import { defaultBadgeColor, instrumentsBadges } from "../../shared/utils/instruments";
import { LocalStorageService } from "../../shared/services/local-storage.service";
import { defaultInstrument } from "./instruments.reducer";
import { withLatestFrom } from "rxjs";
import { Store } from "@ngrx/store";
import { getSelectedInstrumentsWithBadges } from "./instruments.selectors";

@Injectable()
export class InstrumentsEffects {
  initInstrumentsWithBadges = createEffect(() =>
    this.actions$.pipe(
      ofType(initInstrumentsWithBadges),
      map(() => {
        const instruments = this.readInstrumentsFromLocalStorage();

        return initInstrumentsWithBadgesSuccess(instruments || instrumentsBadges.reduce((acc, curr) => {
            acc[curr] = defaultInstrument;
            return acc;
          }, {} as InstrumentBadges));
      })
    )
  );

  createSave$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        newInstrumentByBadgeSelected,
        selectNewInstrumentByBadge
      ),
      map(() => saveInstruments())
    );
  });

  saveInstruments$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(saveInstruments),
      withLatestFrom(this.store.select(getSelectedInstrumentsWithBadges)),
      tap(([, instruments]) => this.saveInstrumentsToLocalStorage(instruments))
    );
  }, { dispatch: false });

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

  private readonly instrumentsStorageKey = 'instruments';

  constructor(
    private readonly actions$: Actions,
    private readonly instrumentsService: InstrumentsService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly localStorage: LocalStorageService,
    private readonly store: Store,
  ) {
  }

  private readInstrumentsFromLocalStorage(): InstrumentBadges | undefined {
    const instruments = this.localStorage.getItem<InstrumentBadges>(this.instrumentsStorageKey);
    if (!instruments) {
      return undefined;
    }

    return instruments;
  }

  private saveInstrumentsToLocalStorage(instruments: InstrumentBadges) {
    this.localStorage.setItem(this.instrumentsStorageKey, instruments);
  }
}
