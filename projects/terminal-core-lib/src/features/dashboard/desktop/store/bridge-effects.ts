import {
  inject,
  Injectable
} from '@angular/core';
import {
  ClientDashboardType,
  Widget
} from '../../types/dashboard.types';
import {Store} from '@ngrx/store';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';
import {
  EMPTY,
  map,
  switchMap
} from 'rxjs';
import {WidgetSettingsServiceActions} from '../../../widget-settings/store/actions';
import {
  DashboardItemsActions,
  DashboardsManageActions
} from './actions';
import {concatLatestFrom} from '@ngrx/operators';
import {DashboardsStreams} from './streams';
import {WidgetSettingsStreams} from '../../../widget-settings/store/streams';
import {WidgetSettings} from '../../../widget-settings/widget-settings.types';
import {GuidGenerator} from '../../../../common/utils/guid-generator';
import {WidgetSettingsHelper} from '../../../widget-settings/utils/widget-settings.helper';

@Injectable()
export class DashboardsBridgeEffects {
  private readonly store = inject(Store);

  private readonly actions$ = inject(Actions);

  removeSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DashboardItemsActions.removeWidgets),
      map(action => WidgetSettingsServiceActions.remove({settingGuids: action.widgetIds}))
    );
  });

  removeAllSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DashboardsManageActions.removeAll),
      map(() => WidgetSettingsServiceActions.removeAll())
    );
  });

  copyDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DashboardsManageActions.copy),
      concatLatestFrom(() => DashboardsStreams.getAllDashboards(this.store)),
      map(([action, allDashboards]) => ({
          action,
          allDashboards
        })
      ),
      concatLatestFrom(() => WidgetSettingsStreams.getAllSettings(this.store)),
      map(([source, widgetSettings]) => ({
          ...source,
          widgetSettings
        })
      ),
      switchMap(params => {
        const targetDashboard = params.allDashboards.find(d => d.guid === params.action.dashboardGuid);
        if (!targetDashboard) {
          return EMPTY;
        }

        const widgetsCopy: Widget[] = [];
        const settingsCopy: WidgetSettings[] = [];

        for (const widget of targetDashboard.items) {
          const newWidgetInstance = {
            ...widget,
            guid: GuidGenerator.newGuid()
          } as Widget;

          widgetsCopy.push(newWidgetInstance);

          const widgetSettings = params.widgetSettings.find(s => s.guid === widget.guid);
          if (widgetSettings) {
            const newSettings = {
              ...JSON.parse(JSON.stringify(widgetSettings)),
              guid: newWidgetInstance.guid
            } as WidgetSettings;

            if (params.action.selectedPortfolio != null && WidgetSettingsHelper.isPortfolioDependent(newSettings)) {
              newSettings.portfolio = params.action.selectedPortfolio.portfolio;
              newSettings.exchange = params.action.selectedPortfolio.exchange;
            }

            settingsCopy.push(newSettings);
          }
        }

        const actions = [];
        if (settingsCopy.length > 0) {
          actions.push(WidgetSettingsServiceActions.add({settings: settingsCopy}));
        }

        const title = params.action.title
          ?? `${targetDashboard.title} ${params.allDashboards.filter(d => d.sourceGuid === targetDashboard.guid).length + 1}`;

        actions.push(DashboardsManageActions.add({
          guid: GuidGenerator.newGuid(),
          sourceGuid: targetDashboard.guid,
          templateId: targetDashboard.templateId,
          title,
          isSelected: true,
          isFavorite: false,
          existedItems: widgetsCopy,
          instrumentsSelection: {
            ...targetDashboard.instrumentsSelection
          },
          selectedPortfolio: params.action.selectedPortfolio,
          dashboardType: targetDashboard.type ?? ClientDashboardType.ClientDesktop
        }));

        return actions;
      })
    );
  });
}
