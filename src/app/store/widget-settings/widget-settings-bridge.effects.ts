import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect
} from '@ngrx/effects';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  first,
  switchMap
} from "rxjs";
import { Store } from "@ngrx/store";
import { getSelectedInstrument } from "../instruments/instruments.selectors";
import { map } from "rxjs/operators";
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";
import {
  getInstrumentLinkedSettings,
  getPortfolioLinkedSettings,
  selectWidgetSettingsState
} from "./widget-settings.selectors";
import {
  updateWidgetSettingsInstrument,
  updateWidgetSettingsPortfolio
} from "./widget-settings.actions";
import { EntityStatus } from "../../shared/models/enums/entity-status";
import { getSelectedPortfolio } from "../portfolios/portfolios.selectors";
import {
  PortfolioKey,
  PortfolioKeyEqualityComparer
} from "../../shared/models/portfolio-key.model";
import { InstrumentEqualityComparer } from "../../shared/utils/instruments";

@Injectable()
export class WidgetSettingsBridgeEffects {
  newInstrumentKeySelected$ = createEffect(() => {
    const newInstrumentSelected$ = this.store.select(getSelectedInstrument).pipe(
      filter(x => !!x),
      map(x => x as InstrumentKey),
      distinctUntilChanged((previous, current) => InstrumentEqualityComparer.equals(previous, current))
    );

    const linkedWidgetSettings$ = this.store.select(getInstrumentLinkedSettings);

    return this.store.select(selectWidgetSettingsState).pipe(
      first(x => x.status === EntityStatus.Success),
      switchMap(() => combineLatest([newInstrumentSelected$, linkedWidgetSettings$])),
      map(([instrumentKey, settings]) => {
        const settingsToUpdate = settings.filter(s => !InstrumentEqualityComparer.equals(instrumentKey, s as InstrumentKey));
        return {
          settingsToUpdate,
          instrumentKey
        };
      }),
      filter(changes => changes.settingsToUpdate.length > 0),
      map(changes => updateWidgetSettingsInstrument({
        settingGuids: changes.settingsToUpdate.map(s => s.guid),
        newInstrumentKey: changes.instrumentKey
      }))
    );
  });

  newPortfolioSelected$ = createEffect(() => {
    const newPortfolioSelected$ = this.store.select(getSelectedPortfolio).pipe(
      filter(x => !!x),
      map(x => x as PortfolioKey),
      distinctUntilChanged((previous, current) => PortfolioKeyEqualityComparer.equals(previous, current)),
    );

    const linkedWidgetSettings$ = this.store.select(getPortfolioLinkedSettings);

    return this.store.select(selectWidgetSettingsState).pipe(
      first(x => x.status === EntityStatus.Success),
      switchMap(() => combineLatest([newPortfolioSelected$, linkedWidgetSettings$])),
      map(([portfolioKey, settings]) => {
        const settingsToUpdate = settings.filter(s => !PortfolioKeyEqualityComparer.equals(portfolioKey, s as PortfolioKey));
        return {
          settingsToUpdate,
          portfolioKey
        };
      }),
      filter(changes => changes.settingsToUpdate.length > 0),
      map(changes => updateWidgetSettingsPortfolio({
        settingGuids: changes.settingsToUpdate.map(s => s.guid),
        newPortfolioKey: changes.portfolioKey
      }))
    );
  });

  constructor(private readonly actions$: Actions, private readonly store: Store) {
  }
}
