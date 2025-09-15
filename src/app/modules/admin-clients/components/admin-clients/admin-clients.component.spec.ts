import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { AdminClientsComponent } from './admin-clients.component';
import { MockProvider } from "ng-mocks";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { EMPTY } from "rxjs";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { AdminClientsService } from "../../services/clients/admin-clients.service";
import { WidgetLocalStateService } from "../../../../shared/services/widget-local-state.service";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";

describe('AdminClientsComponent', () => {
  let component: AdminClientsComponent;
  let fixture: ComponentFixture<AdminClientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminClientsComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(
          WidgetSettingsService,
          {
            getSettings: () => EMPTY
          }
        ),
        MockProvider(AdminClientsService),
        MockProvider(
          WidgetLocalStateService,
          {
            getStateRecord: () => EMPTY
          }
        ),
        MockProvider(ManageDashboardsService)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AdminClientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
