import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboardsPanelComponent } from './admin-dashboards-panel.component';
import { MockProvider } from "ng-mocks";
import { ManageDashboardsService } from "../../../shared/services/manage-dashboards.service";
import { EMPTY } from "rxjs";
import { TranslocoTestsModule } from "../../../shared/utils/testing/translocoTestsModule";

describe('AdminDashboardsPanelComponent', () => {
  let component: AdminDashboardsPanelComponent;
  let fixture: ComponentFixture<AdminDashboardsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminDashboardsPanelComponent,
        TranslocoTestsModule.getModule()
      ],
      providers:[
        MockProvider(
          ManageDashboardsService,
          {
            allDashboards$: EMPTY,
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDashboardsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
