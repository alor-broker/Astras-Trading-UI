import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  filter,
  map,
  Observable,
} from 'rxjs';
import { NewWidget } from 'src/app/shared/models/new-widget.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { WidgetNames } from '../models/enums/widget-names';
import { AnySettings } from '../models/settings/any-settings.model';
import { WidgetFactoryService } from './widget-factory.service';
import { LocalStorageService } from "./local-storage.service";


@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private dashboardsStorage = 'dashboards';
  private settingsStorage = 'settings';
  private profileStorage = 'profile';

  private dashboardSource: BehaviorSubject<Map<string, Widget>>;
  dashboard$ : Observable<Map<string, Widget>>;

  // We can't store settings in dashboard, because it'll cause unnessasary rerenders
  // each time the settings would change
  private settingsSource: BehaviorSubject<Map<string, AnySettings>>;
  settingsByGuid$ : Observable<Map<string, AnySettings>>;

  constructor(
    private readonly factory: WidgetFactoryService,
    private readonly localStorage: LocalStorageService
    ) {
    let firstOpen = false;
    const existingDashboardItems = localStorage.getItem<[string, Widget][]>(this.dashboardsStorage);
    const settingItems = localStorage.getItem<[string, AnySettings][]>(this.settingsStorage);
    let existingDashboard : Map<string, Widget> = new Map();
    if (existingDashboardItems) {
      existingDashboard = new Map(existingDashboardItems);
    }
    else {
      firstOpen = true;
    }
    let existingSettings : Map<string, AnySettings> = new Map();
    if (settingItems) {
      existingSettings = new Map(settingItems);
    }

    this.dashboardSource = new BehaviorSubject<Map<string, Widget>>(existingDashboard);
    this.dashboard$ = this.dashboardSource.asObservable();

    this.settingsSource = new BehaviorSubject<Map<string, AnySettings>>(existingSettings);
    this.settingsByGuid$ = this.settingsSource.asObservable();
    if (firstOpen) {
      this.createDefaultDashboard();
    }
  }

  addWidget(newWidget: NewWidget, additionalSettings?: any) {
    const newSettings = this.factory.createNewSettings(newWidget, additionalSettings);
    const widget = {
      guid: newWidget.gridItem.label,
      gridItem: newWidget.gridItem,
      hasSettings: newWidget.gridItem.type != WidgetNames.instrumentInfo &&
        newWidget.gridItem.type != WidgetNames.allTrades &&
        newWidget.gridItem.type != WidgetNames.news,
      hasHelp: true
    };
    const guid = widget.gridItem.label;
    const widgets = this.getDashboardValue().set(guid, widget);
    const settings = this.getSettingsValue().set(guid, newSettings);
    this.setDashboard(widgets);
    this.setSettings(settings);
  }

  updateWidget(updated: Widget) {
    const guid = updated.gridItem.label;
    const existing = this.getDashboardValue().get(guid);
    if (existing) {
      const widgets = this.getDashboardValue().set(guid, updated);
      this.setDashboard(widgets);
    }
  }

  updateSettings(guid: string, updated: AnySettings) {
    const settings = this.getSettingsValue().set(guid, updated);
    this.setSettings(settings);
  }

  removeWidget(guid: string) {
    let widgets = Array.from(this.getDashboardValue().entries());
    widgets = widgets.filter(([k,]) => k !== guid);
    this.setDashboard(new Map(widgets));
  }

  clearDashboard() {
    this.setDashboard(new Map());
    this.localStorage.removeItem(this.dashboardsStorage);
    this.localStorage.removeItem(this.settingsStorage);
    this.localStorage.removeItem(this.profileStorage);
  }


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saveDashboard(name: string) {
    this.setDashboard(this.getDashboardValue());
  }

  getWidget(guid: string) {
    return this.dashboard$.pipe(
      map((widgetsByGuids) => widgetsByGuids.get(guid)),
      filter((w): w is Widget => !!w)
    );
  }

  getSettings(guid: string) : Observable<AnySettings | null> {
    const settings$  = this.settingsByGuid$.pipe(
      map((map) : AnySettings | null => {
        const settings = map.get(guid);
        return settings ?? null;
      })
    );
    return settings$;
  }

  private setSettings(settingsByGuid: Map<string, AnySettings>) {
    this.settingsSource.next(settingsByGuid);
    this.storeSettings();
  }

  private setDashboard(widgets: Map<string, Widget>) {
    this.dashboardSource.next(widgets);
    this.storeDashboard();
  }

  private getSettingsValue() {
    return this.settingsSource.getValue();
  }

  private getDashboardValue() {
    return this.dashboardSource.getValue();
  }

  private storeDashboard() {
    const dashboard = this.getDashboardValue();
    this.localStorage.setItem(this.dashboardsStorage, Array.from(dashboard.entries()));
  }

  private storeSettings() {
    const settings = this.getSettingsValue();
    this.localStorage.setItem(this.settingsStorage, Array.from(settings.entries()));
  }

  private createDefaultDashboard() {
    setTimeout(() => {
      this.addWidget({
        gridItem: { x: 0, y: 0, cols: 3, rows: 1, type: WidgetNames.lightChart },
      });
      this.addWidget({
        gridItem: { x: 0, y: 1, cols: 2, rows: 1, type: WidgetNames.blotter },
      }, { activeTabIndex: 3 });
      this.addWidget({
        gridItem: { x: 3, y: 0, cols: 1, rows: 1, type: WidgetNames.orderBook },
      }, { depth: 10 });
      this.addWidget({
        gridItem: { x: 4, y: 0, cols: 1, rows: 1, type: WidgetNames.instrumentInfo },
      });
      this.addWidget({
        gridItem: { x: 3, y: 1, cols: 2, rows: 1, type: WidgetNames.instrumentSelect },
      });
      this.addWidget({
        gridItem: { x: 2, y: 1, cols: 1, rows: 1, type: WidgetNames.blotter },
      }, { activeTabIndex: 0 });
    }, 700);
  }
}
