import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
} from 'rxjs';
import { NewWidget } from 'src/app/shared/models/new-widget.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { WidgetNames } from '../models/enums/widget-names';
import { WidgetFactoryService } from './widget-factory.service';
import { LocalStorageService } from "./local-storage.service";
import { WidgetSettingsService } from "./widget-settings.service";


@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  dashboard$: Observable<Map<string, Widget>>;
  private dashboardsStorage = 'dashboards';
  private dashboardSource: BehaviorSubject<Map<string, Widget>>;

  constructor(
    private readonly factory: WidgetFactoryService,
    private readonly localStorage: LocalStorageService,
    private readonly settingsService: WidgetSettingsService
  ) {
    let firstOpen = false;
    const existingDashboardItems = localStorage.getItem<[string, Widget][]>(this.dashboardsStorage);
    let existingDashboard: Map<string, Widget> = new Map();
    if (existingDashboardItems) {
      existingDashboard = new Map(existingDashboardItems);
    } else {
      firstOpen = true;
    }

    this.dashboardSource = new BehaviorSubject<Map<string, Widget>>(existingDashboard);
    this.dashboard$ = this.dashboardSource.asObservable();

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
        newWidget.gridItem.type != WidgetNames.news &&
        newWidget.gridItem.type != WidgetNames.exchangeRate,
      hasHelp: true
    };
    const guid = widget.gridItem.label;
    const widgets = this.getDashboardValue().set(guid, widget);
    this.settingsService.addSettings([newSettings]);
    this.setDashboard(widgets);
  }

  removeWidget(guid: string) {
    let widgets = Array.from(this.getDashboardValue().entries());
    widgets = widgets.filter(([k,]) => k !== guid);
    this.setDashboard(new Map(widgets));
    this.settingsService.removeSettings(guid);
  }

  clearDashboard() {
    this.setDashboard(new Map());
    this.localStorage.removeItem(this.dashboardsStorage);
    this.localStorage.removeItem('terminalSettings');
    this.localStorage.removeItem('watchlistCollection');
    this.localStorage.removeItem('portfolio');
    this.localStorage.removeItem('profile');
    this.localStorage.removeItem('feedback');
    this.localStorage.removeItem('instruments');
    this.settingsService.removeAllSettings();
    this.reloadPage();
  }

  reloadPage() {
    window.location.reload();
  }

  resetDashboard() {
    this.setDashboard(new Map());
    this.localStorage.setItem(this.dashboardsStorage, []);
    this.settingsService.removeAllSettings();
    this.createDefaultDashboard();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saveDashboard(name: string) {
    this.setDashboard(this.getDashboardValue());
  }

  private setDashboard(widgets: Map<string, Widget>) {
    this.dashboardSource.next(widgets);
    this.storeDashboard();
  }

  private getDashboardValue() {
    return this.dashboardSource.getValue();
  }

  private storeDashboard() {
    const dashboard = this.getDashboardValue();
    this.localStorage.setItem(this.dashboardsStorage, Array.from(dashboard.entries()));
  }

  private createDefaultDashboard() {
    setTimeout(() => {
      this.addWidget({
        gridItem: {x: 0, y: 0, cols: 30, rows: 18, type: WidgetNames.techChart},
      });
      this.addWidget({
        gridItem: {x: 30, y: 0, cols: 10, rows: 18, type: WidgetNames.orderBook},
      }, {depth: 10});
      this.addWidget({
        gridItem: {x: 40, y: 0, cols: 10, rows: 18, type: WidgetNames.instrumentInfo},
      });
      this.addWidget({
        gridItem: {x: 0, y: 18, cols: 25, rows: 12, type: WidgetNames.blotter},
      }, {activeTabIndex: 3});
      this.addWidget({
        gridItem: {x: 25, y: 18, cols: 15, rows: 12, type: WidgetNames.blotter},
      }, {activeTabIndex: 0});
      this.addWidget({
        gridItem: {x: 40, y: 18, cols: 10, rows: 12, type: WidgetNames.instrumentSelect},
      });
    }, 700);
  }
}
