import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
} from 'rxjs';
import { NewWidget } from 'src/app/shared/models/new-widget.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { WidgetFactoryService } from 'src/app/shared/services/widget-factory.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private dashboardsStorage = 'dashboards';

  private dashboardSource: BehaviorSubject<Widget[]>;
  readonly dashboard$ : Observable<Widget[]>;

  constructor(private factory: WidgetFactoryService) {
    const existingDashboardJson = localStorage.getItem(this.dashboardsStorage);
    let existingDashboard : Widget[] = [];
    if (existingDashboardJson) {
      existingDashboard = JSON.parse(existingDashboardJson);
    }
    this.dashboardSource = new BehaviorSubject<Widget[]>(existingDashboard);
    this.dashboard$ = this.dashboardSource.asObservable();
  }

  private setDashboard(widgets: Widget[]) {
    this.dashboardSource.next(widgets);
    this.saveDashboard();
  }

  getDashboard() {
    return this.dashboardSource.getValue();
  }

  addWidget(newWidget: NewWidget) {
    const widget = this.factory.createNewWidget(newWidget);
    const widgets = [...this.getDashboard(), widget];
    this.setDashboard(widgets);
  }

  updateWidget(updated: Widget) {
    const existing = this.getDashboard().find(w => w.gridItem.label === updated.gridItem.label);
    if (existing) {
      const updated = this.factory.createNewWidget(existing);
      const widgetsWithoutExisting = this.getDashboard().filter(w => w.gridItem.label !== updated.gridItem.label)
      const widgets = [...widgetsWithoutExisting, existing];
      this.setDashboard(widgets);
    }
  }

  removeWidget(widget: Widget) {
    const widgets = this.getDashboard().filter(w => w !== widget);
    this.setDashboard(widgets);
  }

  saveDashboard() {
    const dashboard = this.getDashboard();
    localStorage.setItem(this.dashboardsStorage, JSON.stringify(dashboard));
  }
}
