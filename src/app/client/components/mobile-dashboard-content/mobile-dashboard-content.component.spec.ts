import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MobileDashboardContentComponent} from "./mobile-dashboard-content.component";
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {EMPTY, of, Subject} from "rxjs";
import {WidgetsMetaService} from "../../../shared/services/widgets-meta.service";
import {MobileActionsContextService} from "../../../modules/dashboard/services/mobile-actions-context.service";
import {MobileDashboardService} from "../../../modules/dashboard/services/mobile-dashboard.service";
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {MockComponents, MockDirectives, MockProvider} from "ng-mocks";
import {WidgetSettingsService} from "../../../shared/services/widget-settings.service";
import {WidgetsSharedDataService} from "../../../shared/services/widgets-shared-data.service";
import {
  NotificationButtonComponent
} from "../../../modules/notifications/components/notification-button/notification-button.component";

describe('MobileDashboardContentComponent', () => {
  let component: MobileDashboardContentComponent;
  let fixture: ComponentFixture<MobileDashboardContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MobileDashboardContentComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(NotificationButtonComponent),
        MockDirectives(NzIconDirective),
      ],
      providers: [
        MockProvider(
          DashboardContextService,
          {
            selectedDashboard$: EMPTY
          }
        ),
        MockProvider(
          WidgetsMetaService,
          {
            getWidgetsMeta: () => EMPTY
          }
        ),
        MockProvider(
          MobileActionsContextService,
          {
            actionEvents$: new Subject()
          }
        ),
        MockProvider(MobileDashboardService),
        MockProvider(
          WidgetsSharedDataService,
          {
            getDataProvideValues: () => EMPTY
          }
        ),
        MockProvider(
          WidgetSettingsService,
          {
            getSettingsOrNull: () => of(null),
          },
        ),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MobileDashboardContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
