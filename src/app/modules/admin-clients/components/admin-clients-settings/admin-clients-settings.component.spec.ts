import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { AdminClientsSettingsComponent } from './admin-clients-settings.component';
import { MockProvider } from "ng-mocks";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { EMPTY } from "rxjs";
import { provideNoopAnimations } from "@angular/platform-browser/animations";

describe('AdminClientsSettingsComponent', () => {
  let component: AdminClientsSettingsComponent;
  let fixture: ComponentFixture<AdminClientsSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminClientsSettingsComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        provideNoopAnimations(),
        MockProvider(
          WidgetSettingsService,
          {
            getSettings: () => EMPTY
          }
        ),
        MockProvider(ManageDashboardsService)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AdminClientsSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
