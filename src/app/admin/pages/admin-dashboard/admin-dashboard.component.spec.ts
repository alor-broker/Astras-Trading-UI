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

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminDashboardComponent,
        ...MockComponents(
          AdminNavbarComponent,
          InstrumentSelectDialogWidgetComponent
        )
      ],
      providers: [
        MockProvider(AdminSettingsBrokerService),
        MockProvider(DashboardContextService),
        MockProvider(WatchlistCollectionBrokerService)
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
