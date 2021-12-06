import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
} from 'rxjs';
import { DashboardItem } from '../models/dashboard-item.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private dashboardsStorage = 'dashboards';
  private newWidgetsSource = new Subject<DashboardItem[]>();
  removeWidgetsSource = new Subject<DashboardItem[]>();

  private dashboardSource: BehaviorSubject<DashboardItem[]>;
  readonly dashboard$ : Observable<DashboardItem[]>;

  constructor() {
    const existingDashboardJson = localStorage.getItem(this.dashboardsStorage);
    let existingDashboard : DashboardItem[] = [];
    if (existingDashboardJson) {
      existingDashboard = JSON.parse(existingDashboardJson);
    }

    this.dashboardSource = new BehaviorSubject<DashboardItem[]>(existingDashboard);
    this.dashboard$ = this.dashboardSource.asObservable();
  }

  private setDashboard(widgets: DashboardItem[]) {
    this.dashboardSource.next(widgets);
    this.saveDashboard();
  }

  getDashboard() {
    return this.dashboardSource.getValue();
  }

  addWidget(widget: DashboardItem) {
    const widgets = [...this.getDashboard(), widget];
    this.setDashboard(widgets);
  }

  removeWidget(widget: DashboardItem) {
    const widgets = this.getDashboard().filter(w => w !== widget);
    this.setDashboard(widgets);
  }

  saveDashboard() {
    const dashboard = this.getDashboard();
    localStorage.setItem(this.dashboardsStorage, JSON.stringify(dashboard));
  }
}
