import { Injectable } from '@angular/core';
import {
  Observable, shareReplay,
  take,
} from 'rxjs';
import {
  DashboardItemPosition,
  Widget
} from '../models/dashboard/widget.model';
import { Store } from '@ngrx/store';
import {Dashboard, DefaultDashboardConfig} from '../models/dashboard/dashboard.model';
import { GuidGenerator } from '../utils/guid';
import { DashboardContextService } from './dashboard-context.service';
import {HttpClient} from "@angular/common/http";
import {DashboardsStreams} from "../../store/dashboards/dashboards.streams";
import { WidgetSettings } from "../models/widget-settings.model";
import {
  filter,
  map
} from "rxjs/operators";
import {
  DashboardFavoritesActions,
  DashboardItemsActions,
  DashboardsCurrentSelectionActions,
  DashboardsManageActions
} from "../../store/dashboards/dashboards-actions";

@Injectable({
  providedIn: 'root',
})
export class ManageDashboardsService {
  private defaultConfig$?: Observable<DefaultDashboardConfig>;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly store: Store,
    private readonly dashboardContextService: DashboardContextService
  ) {
  }

  get allDashboards$(): Observable<Dashboard[]> {
    return DashboardsStreams.getAllDashboards(this.store);
  }

  addWidget(widgetType: string, initialSettings?: { [propName: string]: any }): void {
    this.dashboardContextService.selectedDashboard$.pipe(
      take(1)
    ).subscribe(d => {
      this.store.dispatch(DashboardItemsActions.addWidgets(
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

  copyWidget(sourceSettings: WidgetSettings): void {
    DashboardsStreams.getSelectedDashboard(this.store).pipe(
      map(d => d.items.find(i => i.guid === sourceSettings.guid)),
      take(1),
      filter((w): w is Widget => !!w)
    ).subscribe(w => {
      const newSettings = JSON.parse(JSON.stringify(sourceSettings)) as Omit<WidgetSettings , 'guid'>;

      delete newSettings.guid;

      this.addWidget(
        w.widgetType,
        newSettings
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
      this.store.dispatch(DashboardsManageActions.reset({ dashboardGuid: d.guid }));
    });
  }

  removeDashboard(guid: string): void {
    this.store.dispatch(DashboardsManageActions.remove({ dashboardGuid: guid }));
  }

  copyDashboard(guid: string): void {
    this.store.dispatch(DashboardsManageActions.copy({ dashboardGuid: guid }));
  }

  addDashboard(title: string): void {
    this.store.dispatch(DashboardsManageActions.add({
      guid: GuidGenerator.newGuid(),
      title: title,
      isSelected: true,
      existedItems: []
    }));
  }

  renameDashboard(guid: string, title: string): void {
    this.store.dispatch(DashboardsManageActions.rename({ dashboardGuid: guid, title }));
  }

  addDashboardToFavorites(dashboardGuid: string): void {
    this.store.dispatch(DashboardFavoritesActions.add({ dashboardGuid }));
  }

  removeDashboardFromFavorites(dashboardGuid: string): void {
    this.store.dispatch(DashboardFavoritesActions.remove({ dashboardGuid }));
  }

  changeFavoriteDashboardsOrder(dashboardGuid: string, newIndex: number): void {
    this.store.dispatch(DashboardFavoritesActions.changeOrder({ dashboardGuid, newIndex }));
  }

  selectDashboard(guid: string): void {
    this.store.dispatch(DashboardsCurrentSelectionActions.select({ dashboardGuid: guid }));
  }

  getDefaultDashboardConfig(): Observable<DefaultDashboardConfig> {
    if (!this.defaultConfig$) {
      this.readDefaultConfig();
    }

    return this.defaultConfig$!;
  }

  private readDefaultConfig(): void {
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
