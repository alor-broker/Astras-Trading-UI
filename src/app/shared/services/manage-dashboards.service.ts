import { Injectable } from '@angular/core';
import {
  Observable,
  take,
} from 'rxjs';
import { WidgetNames } from '../models/enums/widget-names';
import { LocalStorageService } from "./local-storage.service";
import {
  DashboardItemPosition,
  Widget
} from '../models/dashboard/widget.model';
import { Store } from '@ngrx/store';
import { Dashboard } from '../models/dashboard/dashboard.model';
import { allDashboards } from '../../store/dashboards/dashboards.selectors';
import { GuidGenerator } from '../utils/guid';
import { ManageDashboardsActions } from '../../store/dashboards/dashboards-actions';
import { DashboardContextService } from './dashboard-context.service';

@Injectable({
  providedIn: 'root',
})
export class ManageDashboardsService {
  constructor(
    private readonly localStorage: LocalStorageService,
    private readonly store: Store,
    private readonly dashboardContextService: DashboardContextService
  ) {
  }

  get allDashboards$(): Observable<Dashboard[]> {
    return this.store.select(allDashboards);
  }

  addWidget(widgetType: string, initialSettings?: any) {
    this.dashboardContextService.selectedDashboard$.pipe(
      take(1)
    ).subscribe(d => {
      this.store.dispatch(ManageDashboardsActions.addWidgets(
        {
          dashboardGuid: d.guid,
          widgets: [{
            widgetType: widgetType,
            position: {
              x: 0,
              y: 0,
              cols: 10,
              rows: 18
            },
            initialSettings: initialSettings
          }]
        }
      ));
    });

  }

  updateWidgetPosition(widgetGuid: string, position: DashboardItemPosition) {
    this.dashboardContextService.selectedDashboard$.pipe(
      take(1)
    ).subscribe(d => {
      this.store.dispatch(ManageDashboardsActions.updateWidgetPosition(
        {
          dashboardGuid: d.guid,
          widgetGuid: widgetGuid,
          position
        }
      ));
    });
  }

  removeWidget(widgetGuid: string) {
    this.dashboardContextService.selectedDashboard$.pipe(
      take(1)
    ).subscribe(d => {
      this.store.dispatch(ManageDashboardsActions.removeWidgets({
          dashboardGuid: d.guid,
          widgetIds: [widgetGuid]
        }
      ));
    });
  }

  resetAll() {
    this.localStorage.removeItem('terminalSettings');
    this.localStorage.removeItem('watchlistCollection');
    this.localStorage.removeItem('portfolio');
    this.localStorage.removeItem('profile');
    this.localStorage.removeItem('feedback');
    this.localStorage.removeItem('dashboards-collection');

    // obsolete keys. Used only for backward compatibility
    this.localStorage.removeItem('instruments');
    this.localStorage.removeItem('dashboards');
    this.store.dispatch(ManageDashboardsActions.removeAllDashboards());
    this.reloadPage();
  }

  resetCurrentDashboard() {
    this.dashboardContextService.selectedDashboard$.pipe(
      take(1)
    ).subscribe(d => {
      this.store.dispatch(ManageDashboardsActions.resetDashboard({ dashboardGuid: d.guid }));
    });
  }

  removeDashboard(guid: string) {
    this.store.dispatch(ManageDashboardsActions.removeDashboard({ dashboardGuid: guid }));
  }

  addDashboard(title: string) {
    this.store.dispatch(ManageDashboardsActions.addDashboard({
      guid: GuidGenerator.newGuid(),
      title: title,
      isSelected: true,
      existedItems: []
    }));
  }

  renameDashboard(guid: string, title: string) {
    this.store.dispatch(ManageDashboardsActions.renameDashboard({ dashboardGuid: guid, title }));
  }

  selectDashboard(guid: string) {
    this.store.dispatch(ManageDashboardsActions.selectDashboard({ dashboardGuid: guid }));
  }

  getDefaultWidgetsSet(): Omit<Widget, 'guid'> [] {
    return [
      {
        widgetType: WidgetNames.techChart,
        position: { x: 0, y: 0, cols: 30, rows: 18 }
      },
      {
        widgetType: WidgetNames.orderBook,
        position: { x: 30, y: 0, cols: 10, rows: 18 }
      },
      {
        widgetType: WidgetNames.instrumentInfo,
        position: { x: 40, y: 0, cols: 10, rows: 18 }
      },
      {
        widgetType: WidgetNames.blotter,
        position: { x: 0, y: 18, cols: 25, rows: 12 },
        initialSettings: { activeTabIndex: 3 }
      },
      {
        widgetType: WidgetNames.blotter,
        position: { x: 25, y: 18, cols: 15, rows: 12 },
        initialSettings: { activeTabIndex: 0 }
      },
      {
        widgetType: WidgetNames.instrumentSelect,
        position: { x: 40, y: 18, cols: 10, rows: 12 }
      }
    ];
  }

  private reloadPage() {
    window.location.reload();
  }
}
