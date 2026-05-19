import {
  inject,
  Injectable
} from '@angular/core';
import {
  Actions,
  createEffect
} from '@ngrx/effects';
import {
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  take,
  withLatestFrom
} from "rxjs";
import {mapWith} from '../../../common/utils/observable/map-with';
import {WidgetSettingsStreams} from './streams';
import {DefaultBadge} from '../../instruments/constants/badges.constants';
import {Store} from '@ngrx/store';
import {InstrumentKey} from '../../../common/types/instrument.types';
import {InstrumentEqualityComparer} from '../../../common/utils/instrument-key.helper';
import {
  WidgetSettingsInternalActions,
  WidgetSettingsServiceActions
} from './actions';
import {PortfolioKeyEqualityComparer} from '../../../common/utils/portfolio-key.helper';
import {PortfolioKey} from '../../../common/types/portfolio.types';
import {TerminalSettingsService} from '../../terminal-settings/services/terminal-settings.service';
import {TerminalSettings} from '../../terminal-settings/terminal-settings.types';
import {DASHBOARD_CONTEXT_SERVICE} from '../../dashboard/services/dashboard-context-service.types';

@Injectable()
export class WidgetSettingsBridgeEffects {
  private readonly actions$ = inject(Actions);

  private readonly store = inject(Store);

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  newInstrumentSelected$ = createEffect(() => {
    const dashboardSettingsUpdate$ = this.dashboardContextService.selectedDashboard$.pipe(
      filter(d => !!d.instrumentsSelection),
      distinctUntilChanged((previous, current) =>
        previous.guid === current.guid
        && previous.items.length === current.items.length
        && JSON.stringify(previous.instrumentsSelection) === JSON.stringify(current.instrumentsSelection)
      ),
      mapWith(() => WidgetSettingsStreams.getInstrumentLinkedSettings(this.store), (d, settings) => ({d, settings})),
      map(({d, settings}) => {
        const dashboardWidgetGuids = d.items.map(x => x.guid);
        const settingsToUpdate = settings
          .filter(s => dashboardWidgetGuids.includes(s.guid))
          .map(s => ({
            guid: s.guid,
            groupKey: s.badgeColor ?? DefaultBadge,
            instrumentKey: s as unknown as InstrumentKey
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
          instrumentKey: changes.instrumentsSelection[u.groupKey] ?? changes.instrumentsSelection[DefaultBadge]!
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
      mapWith(() => WidgetSettingsStreams.getPortfolioLinkedSettings(this.store), (d, settings) => ({d, settings})),
      map(({d, settings}) => {
        const dashboardWidgetGuids = d.items.map(x => x.guid);
        const settingsToUpdate = settings
          .filter(s => dashboardWidgetGuids.includes(s.guid))
          .filter(s => !PortfolioKeyEqualityComparer.equals(d.selectedPortfolio, s as unknown as PortfolioKey));

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

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  terminalSettingsChange$ = createEffect(() => {
    return this.terminalSettingsService.getSettings()
      .pipe(
        withLatestFrom(
          WidgetSettingsStreams.getAllSettings(this.store).pipe(
            map(ws => ws.filter(s => s.badgeColor != null).map(s => s.guid))
          )
        ),
        map(([ts, settingGuids]: [TerminalSettings, string[]]) => {
          if (!(ts.badgesBind ?? false)) {
            return WidgetSettingsInternalActions.setDefaultBadges({settingGuids});
          }
          return WidgetSettingsInternalActions.setDefaultBadges({settingGuids: []});
        }),
      );
  });
}
