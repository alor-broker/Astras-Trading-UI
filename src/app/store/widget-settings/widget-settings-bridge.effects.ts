import { Injectable, inject } from '@angular/core';
import {
  Actions,
  createEffect
} from '@ngrx/effects';
import {
  distinctUntilChanged,
  filter,
  switchMap,
  take,
  withLatestFrom
} from "rxjs";
import { Store } from "@ngrx/store";
import { map } from "rxjs/operators";
import {
  WidgetSettingsInternalActions,
  WidgetSettingsServiceActions
} from "./widget-settings.actions";
import {
  PortfolioKey,
  PortfolioKeyEqualityComparer
} from "../../shared/models/portfolio-key.model";
import { mapWith } from '../../shared/utils/observable-helper';
import { defaultBadgeColor, InstrumentEqualityComparer } from '../../shared/utils/instruments';
import { InstrumentKey } from '../../shared/models/instruments/instrument-key.model';
import { DashboardContextService } from "../../shared/services/dashboard-context.service";
import {TerminalSettingsStreams} from "../terminal-settings/terminal-settings.streams";
import {TerminalSettings} from "../../shared/models/terminal-settings/terminal-settings.model";
import {WidgetSettingsStreams} from "./widget-settings.streams";

@Injectable()
export class WidgetSettingsBridgeEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly dashboardContextService = inject(DashboardContextService);

  newInstrumentSelected$ = createEffect(() => {
    const dashboardSettingsUpdate$ = this.dashboardContextService.selectedDashboard$.pipe(
      filter(d => !!d.instrumentsSelection),
      distinctUntilChanged((previous, current) =>
        previous.guid === current.guid
        && previous.items.length === current.items.length
        && JSON.stringify(previous.instrumentsSelection) === JSON.stringify(current.instrumentsSelection)
      ),
      mapWith(() => WidgetSettingsStreams.getInstrumentLinkedSettings(this.store), (d, settings) => ({ d, settings })),
      map(({ d, settings }) => {
        const dashboardWidgetGuids = d.items.map(x => x.guid);
        const settingsToUpdate = settings
          .filter(s => dashboardWidgetGuids.includes(s.guid))
          .map(s => ({
              guid: s.guid,
              groupKey:  s.badgeColor ?? defaultBadgeColor,
              instrumentKey: (<any>s) as InstrumentKey
            }))
          .filter(s => !InstrumentEqualityComparer.equals(d.instrumentsSelection![s.groupKey]!, s.instrumentKey));
        return {
          settingsToUpdate,
          instrumentsSelection: d.instrumentsSelection!
        };
      }),
      filter(changes => changes.settingsToUpdate.length > 0),
      map(changes => WidgetSettingsServiceActions.updateInstrument({
        updates: changes.settingsToUpdate.map(u => ({
          guid: u.guid,
          instrumentKey: changes.instrumentsSelection[u.groupKey] ?? changes.instrumentsSelection[defaultBadgeColor]!
        }))
      }))
    );

    return WidgetSettingsStreams.getState(this.store).pipe(
      take(1),
      switchMap(() => dashboardSettingsUpdate$),
    );
  });

  newPortfolioSelected$ = createEffect(() => {
    const dashboardSettingsUpdate$ = this.dashboardContextService.selectedDashboard$.pipe(
      filter(d => !!d.selectedPortfolio),
      distinctUntilChanged((previous, current) => PortfolioKeyEqualityComparer.equals(previous.selectedPortfolio, current.selectedPortfolio)),
      mapWith(() => WidgetSettingsStreams.getPortfolioLinkedSettings(this.store), (d, settings) => ({ d, settings })),
      map(({ d, settings }) => {
        const dashboardWidgetGuids = d.items.map(x => x.guid);
        const settingsToUpdate = settings
          .filter(s => dashboardWidgetGuids.includes(s.guid))
          .filter(s => !PortfolioKeyEqualityComparer.equals(d.selectedPortfolio, (<any>s) as PortfolioKey));

        return {
          settingsToUpdate,
          portfolioKey: d.selectedPortfolio!
        };
      }),
      filter(changes => changes.settingsToUpdate.length > 0),
      map(changes => WidgetSettingsServiceActions.updatePortfolio({
        settingGuids: changes.settingsToUpdate.map(s => s.guid),
        newPortfolioKey: changes.portfolioKey
      }))
    );

    return WidgetSettingsStreams.getState(this.store).pipe(
      take(1),
      switchMap(() => dashboardSettingsUpdate$),
    );
  });

  terminalSettingsChange$ = createEffect(() => {
    return TerminalSettingsStreams.getSettings(this.store)
      .pipe(
        withLatestFrom(
          WidgetSettingsStreams.getAllSettings(this.store).pipe(
            map(ws => ws.filter(s => s.badgeColor != null).map(s => s.guid))
          )
        ),
        map(([ts, settingGuids]: [TerminalSettings, string[]]) => {
          if (!(ts.badgesBind ?? false)) {
            return WidgetSettingsInternalActions.setDefaultBadges({ settingGuids });
          }
          return WidgetSettingsInternalActions.setDefaultBadges({ settingGuids: [] });
        }),
      );
  });
}
