import { Injectable } from '@angular/core';
import { JSONSchema, StorageMap } from '@ngx-pwa/local-storage';
import { DashboardItem } from '../models/user/dashboard-item.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardSettingsService {
  private dashboardsStorage = 'dashboards'
  constructor(private storage: StorageMap) {}

  getDashboard() {
    this.storage.get<DashboardItem>(this.dashboardsStorage, {
      type: 'object',
      properties: { }
    });
  }

  setDashboard(item: DashboardItem) {
    this.storage.set(this.dashboardsStorage, item)
  }
}
