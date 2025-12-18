import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AdminDashboardComponent} from './admin-dashboard.component';
import {AdminSettingsBrokerService} from "../../services/settings/admin-settings-broker.service";
import {MockComponents, MockProvider} from "ng-mocks";
import {AdminNavbarComponent} from "../../components/admin-navbar/admin-navbar.component";
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {
  WatchlistCollectionBrokerService
} from "../../../modules/instruments/services/watchlist-collection-broker.service";
import { InstrumentSelectDialogWidgetComponent } from "../../../modules/instruments/widgets/instrument-select-dialog-widget/instrument-select-dialog-widget.component";
import {GraphStorageService} from "../../../modules/ai-graph/services/graph-storage.service";
import {DashboardComponent} from "../../../modules/dashboard/components/dashboard/dashboard.component";
import {
  OrdersDialogWidgetComponent
} from "../../../modules/order-commands/widgets/orders-dialog-widget/orders-dialog-widget.component";
import {
  EditOrderDialogWidgetComponent
} from "../../../modules/order-commands/widgets/edit-order-dialog-widget/edit-order-dialog-widget.component";

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminDashboardComponent,
        ...MockComponents(
          AdminNavbarComponent,
          InstrumentSelectDialogWidgetComponent,
          DashboardComponent,
          OrdersDialogWidgetComponent,
          EditOrderDialogWidgetComponent,
        )
      ],
      providers: [
        MockProvider(AdminSettingsBrokerService),
        MockProvider(DashboardContextService),
        MockProvider(WatchlistCollectionBrokerService),
        MockProvider(GraphStorageService),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
