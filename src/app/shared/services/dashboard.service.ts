import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  filter,
  map,
  Observable,
} from 'rxjs';
import { NewWidget } from 'src/app/shared/models/new-widget.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { AnySettings } from '../models/settings/any-settings.model';
import { WidgetFactoryService } from './widget-factory.service';


@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private dashboardsStorage = 'dashboards';
  private settingsStorage = 'settings';

  private dashboardSource: BehaviorSubject<Map<string, Widget<AnySettings>>>;
  dashboard$ : Observable<Map<string, Widget<AnySettings>>>;

  // We can't store settings in dashboard, because it'll cause unnessasary rerenders
  // each time the settings would change
  private settingsSource: BehaviorSubject<Map<string, AnySettings>>;
  settingsByGuid$ : Observable<Map<string, AnySettings>>;

  constructor(private factory: WidgetFactoryService) {
    const existingDashboardJson = localStorage.getItem(this.dashboardsStorage);
    const settingsJson = localStorage.getItem(this.settingsStorage);
    let existingDashboard : Map<string, Widget<AnySettings>> = new Map();
    if (existingDashboardJson) {
      existingDashboard = new Map(JSON.parse(existingDashboardJson));
    }
    let existingSettings : Map<string, AnySettings> = new Map();
    if (settingsJson) {
      existingSettings = new Map(JSON.parse(settingsJson));
    }

    this.dashboardSource = new BehaviorSubject<Map<string, Widget<AnySettings>>>(existingDashboard);
    this.dashboard$ = this.dashboardSource.asObservable();

    this.settingsSource = new BehaviorSubject<Map<string, AnySettings>>(existingSettings);
    this.settingsByGuid$ = this.settingsSource.asObservable();
  }

  addWidget(newWidget: NewWidget) {
    const widget = this.factory.createNewWidget(newWidget);
    const guid = widget.gridItem.label;
    const widgets = this.getDashboardValue().set(guid, widget);
    const settings = this.getSettingsValue().set(guid, widget.settings);
    this.setDashboard(widgets);
    this.setSettings(settings);
  }

  updateWidget(updated: Widget<AnySettings>) {
    const guid = updated.gridItem.label;
    const existing = this.getDashboardValue().get(guid);
    if (existing) {
      const updated = this.factory.createNewWidget(existing);
      const widgets = this.getDashboardValue().set(guid, updated);
      this.setDashboard(widgets);
    }
  }

  updateSettings(guid: string, updated: AnySettings) {
    const settings = this.getSettingsValue().set(guid, updated);
    this.setSettings(settings);
  }

  removeWidget(guid: string) {
    let widgets = Array.from(this.getDashboardValue().entries())
    widgets = widgets.filter(([k,_]) => k !== guid);
    this.setDashboard(new Map(widgets));
  }

  clearDashboard() {
    this.setDashboard(new Map())
  }

  getWidget(guid: string) {
    return this.dashboard$.pipe(
      map((widgetsByGuids) => widgetsByGuids.get(guid)),
      filter((w): w is Widget<AnySettings> => !!w)
    )
  }

  getSettings(guid: string) : Observable<AnySettings | null> {
    const settings$  = this.settingsByGuid$.pipe(
      map((map) : AnySettings | null => {
        const settings = map.get(guid);
        return settings ?? null;
      })
    )
    return settings$;
  }

  private setSettings(settingsByGuid: Map<string, AnySettings>) {
    this.settingsSource.next(settingsByGuid);
    this.storeSettings();
  }

  private setDashboard(widgets: Map<string, Widget<AnySettings>>) {
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
    localStorage.setItem(this.dashboardsStorage, JSON.stringify(Array.from(dashboard.entries())));
  }

  private storeSettings() {
    const settings = this.getSettingsValue();
    localStorage.setItem(this.settingsStorage, JSON.stringify(Array.from(settings.entries())));
  }
}
