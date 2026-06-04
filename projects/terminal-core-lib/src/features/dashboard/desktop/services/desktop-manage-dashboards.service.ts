import {
  inject,
  Injectable
} from '@angular/core';
import {
  filter,
  map,
  Observable,
  take
} from "rxjs";
import {Store} from '@ngrx/store';
import {
  ClientDashboardType,
  Dashboard,
  DashboardItemPosition,
  Widget
} from "../../types/dashboard.types";
import {DashboardsStreams} from '../store/streams';
import {
  DashboardFavoritesActions,
  DashboardItemsActions,
  DashboardsCurrentSelectionActions,
  DashboardsEventsActions,
  DashboardsInternalActions,
  DashboardsManageActions
} from "../store/actions";
import {WidgetSettings} from '../../../widget-settings/widget-settings.types';
import {PortfolioKey} from '../../../../common/types/portfolio.types';
import {GuidGenerator} from '../../../../common/utils/guid-generator';
import {DashboardsFeature} from '@terminal-core-lib/features/dashboard/desktop/store/reducer';
import {EntityStatus} from '@terminal-core-lib/common/types/entity-status.types';
import {
  Actions,
  ofType
} from '@ngrx/effects';
import {DesktopDashboardContextService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-dashboard-context.service';

@Injectable()
export class DesktopManageDashboardsService {
  private readonly dashboardContextService = inject(DesktopDashboardContextService);

  private readonly store = inject(Store);

  private readonly actions = inject(Actions);

  get allDashboards$(): Observable<Dashboard[]> {
    return DashboardsStreams.getAllDashboards(this.store);
  }

  addWidget(widgetType: string, initialSettings?: Record<string, unknown>, initialSize?: {
    cols: number;
    rows: number;
  }): void {
    this.dashboardContextService.selectedDashboard$.pipe(
      take(1)
    ).subscribe(d => {
      this.store.dispatch(DashboardItemsActions.addWidgets(
        {
          dashboardGuid: d.guid,
          widgets: [{
            widgetType: widgetType,
            initialSettings: initialSettings,
            initialSize
          }]
        }
      ));
    });
  }

  copyWidget(sourceSettings: WidgetSettings): void {
    DashboardsStreams.getSelectedDashboard(this.store).pipe(
      map(d => d.items.find(i => i.guid === sourceSettings.guid)),
      take(1),
      filter((w): w is Widget => !!w)
    ).subscribe(w => {
      const newSettings = JSON.parse(JSON.stringify(sourceSettings)) as Omit<WidgetSettings, 'guid'> & Partial<Pick<WidgetSettings, 'guid'>>;

      delete newSettings.guid;

      this.addWidget(
        w.widgetType,
        newSettings,
        {
          cols: w.position?.cols ?? 5,
          rows: w.position?.rows ?? 5,
        }
      );
    });
  }

  updateWidgetPositions(updates: { widgetGuid: string, position: DashboardItemPosition } []): void {
    this.dashboardContextService.selectedDashboard$.pipe(
      take(1)
    ).subscribe(d => {
      this.store.dispatch(DashboardItemsActions.updateWidgetsPositions(
        {
          dashboardGuid: d.guid,
          updates
        }
      ));
    });
  }

  removeWidget(widgetGuid: string): void {
    this.dashboardContextService.selectedDashboard$.pipe(
      take(1)
    ).subscribe(d => {
      this.store.dispatch(DashboardItemsActions.removeWidgets({
          dashboardGuid: d.guid,
          widgetIds: [widgetGuid]
        }
      ));
    });
  }

  resetCurrentDashboard(): void {
    this.dashboardContextService.selectedDashboard$.pipe(
      take(1)
    ).subscribe(d => {
      this.store.dispatch(DashboardsManageActions.reset({dashboardGuid: d.guid}));
    });
  }

  removeDashboard(guid: string): void {
    this.store.dispatch(DashboardsManageActions.remove({dashboardGuid: guid}));
  }

  copyDashboard(
    guid: string,
    title?: string,
    selectedPortfolio?: PortfolioKey): void {
    this.store.dispatch(DashboardsManageActions.copy({dashboardGuid: guid, selectedPortfolio, title}));
  }

  addDashboard(title: string): void {
    this.store.dispatch(DashboardsManageActions.add({
      guid: GuidGenerator.newGuid(),
      title: title,
      isSelected: true,
      isFavorite: false,
      existedItems: [],
      dashboardType: ClientDashboardType.ClientDesktop
    }));
  }

  addDashboardWithTemplate(template: Omit<Dashboard, 'guid' | 'version' | 'sourceGuid' | 'favoritesOrder'>): void {
    this.store.dispatch(DashboardsManageActions.add({
      guid: GuidGenerator.newGuid(),
      ...template,
      existedItems: template.items,
      isSelected: template.isSelected ?? false,
      isFavorite: template.isFavorite ?? false,
      instrumentsSelection: template.instrumentsSelection ?? undefined,
      selectedPortfolio: template.selectedPortfolio ?? undefined,
      dashboardType: template.type ?? ClientDashboardType.ClientDesktop
    }));
  }

  renameDashboard(guid: string, title: string): void {
    this.store.dispatch(DashboardsManageActions.rename({dashboardGuid: guid, title}));
  }

  addDashboardToFavorites(dashboardGuid: string): void {
    this.store.dispatch(DashboardFavoritesActions.add({dashboardGuid}));
  }

  removeDashboardFromFavorites(dashboardGuid: string): void {
    this.store.dispatch(DashboardFavoritesActions.remove({dashboardGuid}));
  }

  changeFavoriteDashboardsOrder(dashboardGuid: string, newIndex: number): void {
    this.store.dispatch(DashboardFavoritesActions.changeOrder({dashboardGuid, newIndex}));
  }

  setDashboardLock(dashboardGuid: string, isLocked: boolean): void {
    this.store.dispatch(DashboardsManageActions.changeLock({dashboardGuid, isLocked}));
  }

  selectDashboard(guid: string): void {
    this.store.dispatch(DashboardsCurrentSelectionActions.select({dashboardGuid: guid}));
  }

  removeInitialSettings(items: { dashboardGuid: string, itemGuids: string[] }[]): void {
    this.store.dispatch(DashboardsInternalActions.cleanInitialSettings({items}));
  }

  init(dashboards: Dashboard[]): void {
    this.store.select(DashboardsFeature.selectDashboardsState).pipe(
      filter(state => state.status === EntityStatus.Initial),
      take(1)
    ).subscribe(() => {
      this.store.dispatch(DashboardsInternalActions.init({dashboards}));
    });
  }

  onUpdated(): Observable<{ dashboards: Dashboard[] }> {
    return this.actions.pipe(
      ofType(DashboardsEventsActions.updated),
      map(a => ({dashboards: a.dashboards}))
    );
  }
}
