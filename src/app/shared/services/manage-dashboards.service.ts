import { Injectable, inject } from '@angular/core';
import {
  Observable,
  shareReplay,
  take,
} from 'rxjs';
import {
  DashboardItemPosition,
  Widget
} from '../models/dashboard/widget.model';
import { Store } from '@ngrx/store';
import {
  ClientDashboardType,
  Dashboard,
  DashboardTemplateConfig
} from '../models/dashboard/dashboard.model';
import { GuidGenerator } from '../utils/guid';
import { DashboardContextService } from './dashboard-context.service';
import {
  HttpClient,
  HttpContext
} from "@angular/common/http";
import { DashboardsStreams } from "../../store/dashboards/dashboards.streams";
import { WidgetSettings } from "../models/widget-settings.model";
import {
  filter,
  map
} from "rxjs/operators";
import {
  DashboardFavoritesActions,
  DashboardItemsActions,
  DashboardsCurrentSelectionActions,
  DashboardsInternalActions,
  DashboardsManageActions
} from "../../store/dashboards/dashboards-actions";
import { HttpContextTokens } from "../constants/http.constants";

@Injectable({
  providedIn: 'root',
})
export class ManageDashboardsService {
  private readonly httpClient = inject(HttpClient);
  private readonly store = inject(Store);
  private readonly dashboardContextService = inject(DashboardContextService);

  private defaultConfig$?: Observable<DashboardTemplateConfig[]>;

  get allDashboards$(): Observable<Dashboard[]> {
    return DashboardsStreams.getAllDashboards(this.store);
  }

  addWidget(widgetType: string, initialSettings?: Record<string, any>, initialSize?: { cols: number, rows: number }): void {
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
      const newSettings = JSON.parse(JSON.stringify(sourceSettings)) as Omit<WidgetSettings , 'guid'> & Partial<Pick<WidgetSettings, 'guid'>>;

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

  setDashboardLock(dashboardGuid: string, isLocked: boolean): void {
    this.store.dispatch(DashboardsManageActions.changeLock({dashboardGuid, isLocked}));
  }

  selectDashboard(guid: string): void {
    this.store.dispatch(DashboardsCurrentSelectionActions.select({ dashboardGuid: guid }));
  }

  getDashboardTemplatesConfig(): Observable<DashboardTemplateConfig[]> {
    if (!this.defaultConfig$) {
      this.readTemplatesConfig();
    }

    return this.defaultConfig$!;
  }

  removeInitialSettings(items: { dashboardGuid: string, itemGuids: string[] }[]): void {
    this.store.dispatch(DashboardsInternalActions.cleanInitialSettings({items}));
  }

  private readTemplatesConfig(): void {
    this.defaultConfig$ = this.httpClient.get<DashboardTemplateConfig[]>(
      '../../../assets/default-dashboards-config.json',
      {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true),
      }
    )
      .pipe(
        shareReplay(1)
      );
  }
}
