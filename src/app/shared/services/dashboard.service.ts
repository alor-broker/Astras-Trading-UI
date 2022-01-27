import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
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
  private settingsByGuid = new BehaviorSubject<Map<string, AnySettings>>(new Map())

  private dashboardSource: BehaviorSubject<Widget<AnySettings>[]>;
  dashboard$ : Observable<Widget<AnySettings>[]>;

  constructor(private factory: WidgetFactoryService) {
    const existingDashboardJson = localStorage.getItem(this.dashboardsStorage);
    let existingDashboard : Widget<AnySettings>[] = [];
    if (existingDashboardJson) {
      existingDashboard = JSON.parse(existingDashboardJson);
    }
    this.dashboardSource = new BehaviorSubject<Widget<AnySettings>[]>(existingDashboard);
    this.dashboard$ = this.dashboardSource.asObservable();
  }

  addWidget(newWidget: NewWidget) {
    const widget = this.factory.createNewWidget(newWidget);
    const widgets = [...this.getDashboard(), widget];
    this.setDashboard(widgets);
  }

  updateWidget(updated: Widget<AnySettings>) {
    const existing = this.getDashboard().find(w => w.gridItem.label === updated.gridItem.label);
    if (existing) {
      const updated = this.factory.createNewWidget(existing);
      const widgetsWithoutExisting = this.getDashboard().filter(w => w.gridItem.label !== updated.gridItem.label)
      const widgets = [...widgetsWithoutExisting, updated];
      this.setDashboard(widgets);
    }
  }

  updateWidgetSettings(guid: string, updated: AnySettings) {
    const existing = this.getDashboard().find(w => w.gridItem.label === guid);
    if (existing) {
      existing.settings = updated;
      this.updateWidget(existing);
    }
  }

  removeWidget(widget: Widget<AnySettings>) {
    const widgets = this.getDashboard().filter(w => w !== widget);
    this.setDashboard(widgets);
  }

  saveDashboard() {
    const dashboard = this.getDashboard();
    localStorage.setItem(this.dashboardsStorage, JSON.stringify(dashboard));
  }

  clearDashboard() {
    this.setDashboard([])
  }

  private setDashboard(widgets: Widget<AnySettings>[]) {
    this.dashboardSource.next(widgets);
    this.saveDashboard();
  }

  private getDashboard() {
    return this.dashboardSource.getValue();
  }
}
