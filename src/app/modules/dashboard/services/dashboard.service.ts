import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
} from 'rxjs';
import { NewWidget } from 'src/app/shared/models/new-widget.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { WidgetFactoryService } from 'src/app/modules/dashboard/services/widget-factory.service';
import { OrderbookSettings } from '../../orderbook/models/orderbook-settings.model';
import { TradingviewChartSettings } from '../models/tradingview-chart-settings.model';
import { AnySettings } from '../models/any-settings.model';


@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private dashboardsStorage = 'dashboards';

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

  private setDashboard(widgets: Widget<AnySettings>[]) {
    this.dashboardSource.next(widgets);
    this.saveDashboard();
  }

  private getDashboard() {
    return this.dashboardSource.getValue();
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

  removeWidget(widget: Widget<AnySettings>) {
    const widgets = this.getDashboard().filter(w => w !== widget);
    this.setDashboard(widgets);
  }

  saveDashboard() {
    const dashboard = this.getDashboard();
    localStorage.setItem(this.dashboardsStorage, JSON.stringify(dashboard));
  }
}
