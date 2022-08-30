import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect
} from '@ngrx/effects';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  switchMap,
  take, withLatestFrom
} from "rxjs";
import { Store } from "@ngrx/store";
import { getSelectedInstrumentsWithBadges } from "../instruments/instruments.selectors";
import { map } from "rxjs/operators";
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";
import {
  getAllSettings,
  getInstrumentLinkedSettings,
  getPortfolioLinkedSettings,
  selectWidgetSettingsState
} from "./widget-settings.selectors";
import {
  setDefaultBadges,
  updateWidgetSettingsInstrumentWithBadge,
  updateWidgetSettingsPortfolio
} from "./widget-settings.actions";
import { EntityStatus } from "../../shared/models/enums/entity-status";
import { getSelectedPortfolio } from "../portfolios/portfolios.selectors";
import {
  PortfolioKey,
  PortfolioKeyEqualityComparer
} from "../../shared/models/portfolio-key.model";
import { InstrumentEqualityComparer } from "../../shared/utils/instruments";
import { selectTerminalSettingsState } from "../terminal-settings/terminal-settings.selectors";
import { State } from "../terminal-settings/terminal-settings.reducer";

@Injectable()
export class WidgetSettingsBridgeEffects {
  newInstrumentKeyByBadgeSelected$ = createEffect(() => {
    const newInstrumentsWithBadges$ = this.store.select(getSelectedInstrumentsWithBadges).pipe(
      filter(x => !!x),
      map(x => x as { [badgeColor: string]: InstrumentKey }),
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
    );

    const linkedWidgetSettings$ = this.store.select(getInstrumentLinkedSettings);

    return this.store.select(selectWidgetSettingsState).pipe(
      filter(x => x.status === EntityStatus.Success),
      take(1),
      switchMap(() => combineLatest([newInstrumentsWithBadges$, linkedWidgetSettings$])),
      map(([badges, settings]) => {
        const settingsToUpdate = settings.filter(s =>
          !InstrumentEqualityComparer.equals(badges[s.badgeColor!] as InstrumentKey, s as InstrumentKey));
        return {
          settingsToUpdate,
          badges
        };
      }),
      filter(changes => changes.settingsToUpdate.length > 0),
      map(changes => updateWidgetSettingsInstrumentWithBadge({
          settingGuids: changes.settingsToUpdate.map(s => s.guid),
          badges: changes.badges
        })
      )
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
      filter(x => x.status === EntityStatus.Success),
      take(1),
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

  terminalSettingsChange$ = createEffect(() => {
    return this.store.select(selectTerminalSettingsState)
      .pipe(
        withLatestFrom(this.store.select(getAllSettings)
            .pipe(
              map(ws => ws.filter(s => !!s.badgeColor).map(s => s.guid))
            )
        ),
        map(([ts, settingGuids]: [State, string[]]) => {
          if (!ts.settings?.badgesBind) {
            return setDefaultBadges({settingGuids});
          }
          return setDefaultBadges({settingGuids: []});
        }),
      );
  });

  constructor(private readonly actions$: Actions, private readonly store: Store) {
  }
}
