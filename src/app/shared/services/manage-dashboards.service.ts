import { Injectable } from '@angular/core';
import {
  Observable, shareReplay,
  take,
} from 'rxjs';
import { LocalStorageService } from "./local-storage.service";
import {
  DashboardItemPosition
} from '../models/dashboard/widget.model';
import { Store } from '@ngrx/store';
import {Dashboard, DefaultDashboardConfig} from '../models/dashboard/dashboard.model';
import { allDashboards } from '../../store/dashboards/dashboards.selectors';
import { GuidGenerator } from '../utils/guid';
import { ManageDashboardsActions } from '../../store/dashboards/dashboards-actions';
import { DashboardContextService } from './dashboard-context.service';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})
export class ManageDashboardsService {
  private defaultConfig$?: Observable<DefaultDashboardConfig>;

  constructor(
    private readonly httpClient: HttpClient,
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
            initialSettings: initialSettings
          }]
        }
      ));
    });

  }

  updateWidgetPositions(updates: { widgetGuid: string, position: DashboardItemPosition } []) {
    this.dashboardContextService.selectedDashboard$.pipe(
      take(1)
    ).subscribe(d => {
      this.store.dispatch(ManageDashboardsActions.updateWidgetPositions(
        {
          dashboardGuid: d.guid,
          updates
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
    this.localStorage.removeItem('mobile-dashboard');
    this.localStorage.removeItem('instruments-history');

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

  getDefaultDashboardConfig(): Observable<DefaultDashboardConfig> {
    if (!this.defaultConfig$) {
      this.readDefaultConfig();
    }

    return this.defaultConfig$!;
  }

  private reloadPage() {
    window.location.reload();
  }

  private readDefaultConfig() {
    this.defaultConfig$ = this.httpClient.get<DefaultDashboardConfig>(
      '../../../assets/default-dashboard-config.json',
      {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      }
    )
      .pipe(
        shareReplay(1)
      );
  }
}
