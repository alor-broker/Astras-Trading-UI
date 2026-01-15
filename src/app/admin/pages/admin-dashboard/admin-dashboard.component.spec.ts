import {ComponentFixture, TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';

import {AdminDashboardComponent} from './admin-dashboard.component';
import {AdminSettingsBrokerService} from "../../services/settings/admin-settings-broker.service";
import {MockBuilder, MockInstance} from "ng-mocks";
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {
  WatchlistCollectionBrokerService
} from "../../../modules/instruments/services/watchlist-collection-broker.service";
import {GraphStorageService} from "../../../modules/ai-graph/services/graph-storage.service";
import {DashboardComponent} from "../../../modules/dashboard/components/dashboard/dashboard.component";
import {
  OrdersDialogWidgetComponent
} from "../../../modules/order-commands/widgets/orders-dialog-widget/orders-dialog-widget.component";
import {
  InstrumentSelectDialogWidgetComponent
} from "../../../modules/instruments/widgets/instrument-select-dialog-widget/instrument-select-dialog-widget.component";

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  beforeEach(() => {
    MockInstance(DashboardComponent, (instance) => {
      (instance as any).gridster = signal(undefined);
    });
    MockInstance(OrdersDialogWidgetComponent, (instance) => {
      (instance as any).orderTabs = signal(undefined);
      (instance as any).limitOrderTab = signal(undefined);
      (instance as any).marketOrderTab = signal(undefined);
      (instance as any).stopOrderTab = signal(undefined);
    });
    MockInstance(InstrumentSelectDialogWidgetComponent, (instance) => {
      (instance as any).instrumentNameControlQuery = signal([]);
    });

    return MockBuilder(AdminDashboardComponent)
      .mock(AdminSettingsBrokerService)
      .mock(DashboardContextService)
      .mock(WatchlistCollectionBrokerService)
      .mock(GraphStorageService);
  });

  it('should create', () => {
    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
