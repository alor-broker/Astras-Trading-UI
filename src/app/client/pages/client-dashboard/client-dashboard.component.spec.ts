import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ClientDashboardComponent} from './client-dashboard.component';
import {StoreModule} from "@ngrx/store";
import {EffectsModule} from "@ngrx/effects";
import {DashboardsFeature} from "../../../store/dashboards/dashboards.reducer";
import {OnboardingService} from "../../../modules/dashboard/services/onboarding.service";
import {DesktopSettingsBrokerService} from "../../../modules/dashboard/services/desktop-settings-broker.service";
import {commonTestProviders} from "../../../shared/utils/testing/common-test-providers";
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockProvider} from "ng-mocks";
import {ClientNavbarComponent} from "../../components/client-navbar/client-navbar.component";
import {
  SettingsLoadErrorDialogComponent
} from "../../../modules/dashboard/components/settings-load-error-dialog/settings-load-error-dialog.component";
import {
  TerminalSettingsWidgetComponent
} from "../../../modules/terminal-settings/widgets/terminal-settings-widget/terminal-settings-widget.component";
import {RouterModule} from "@angular/router";
import {
  WatchlistCollectionBrokerService
} from "../../../modules/instruments/services/watchlist-collection-broker.service";
import {
  InstrumentSelectDialogWidgetComponent
} from "../../../modules/instruments/widgets/instrument-select-dialog-widget/instrument-select-dialog-widget.component";
import {GraphStorageService} from "../../../modules/ai-graph/services/graph-storage.service";
import {
  UrgentNotificationDialogComponent
} from "../../../modules/urgent-notifications/components/urgent-notification-dialog/urgent-notification-dialog.component";
import {DashboardComponent} from "../../../modules/dashboard/components/dashboard/dashboard.component";
import {
  OrdersDialogWidgetComponent
} from "../../../modules/order-commands/widgets/orders-dialog-widget/orders-dialog-widget.component";
import {
  EditOrderDialogWidgetComponent
} from "../../../modules/order-commands/widgets/edit-order-dialog-widget/edit-order-dialog-widget.component";
import {NzContentComponent, NzHeaderComponent, NzLayoutComponent} from "ng-zorro-antd/layout";
import {FeedbackWidgetComponent} from "../../../modules/feedback/widgets/feedback-widget/feedback-widget.component";
import {ACTIONS_CONTEXT} from "../../../shared/services/actions-context";
import {EXPORT_SETTINGS_SERVICE_TOKEN} from "../../../shared/services/settings/export-settings.service";
import {
  ApplicationUpdatedWidgetComponent
} from "../../../modules/application-meta/widgets/application-updated-widget/application-updated-widget.component";

xdescribe('ClientDashboardComponent', () => {
  let component: ClientDashboardComponent;
  let fixture: ComponentFixture<ClientDashboardComponent>;

  const spyOnboarding = jasmine.createSpyObj('OnboardingService', ['start']);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ClientDashboardComponent,
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(DashboardsFeature),
        TranslocoTestsModule.getModule(),
        RouterModule.forRoot([]),
        MockComponents(
          NzContentComponent,
          NzHeaderComponent,
          NzLayoutComponent,
          ClientNavbarComponent,
          FeedbackWidgetComponent,
          SettingsLoadErrorDialogComponent,
          TerminalSettingsWidgetComponent,
          InstrumentSelectDialogWidgetComponent,
          UrgentNotificationDialogComponent,
          DashboardComponent,
          OrdersDialogWidgetComponent,
          EditOrderDialogWidgetComponent,
          ApplicationUpdatedWidgetComponent
        )
      ],
      providers: [
        {
          provide: OnboardingService,
          useValue: spyOnboarding
        },
        {
          provide: DesktopSettingsBrokerService,
          useValue: {
            initSettingsBrokers: jasmine.createSpy('initSettingsBrokers').and.callThrough()
          }
        },
        MockProvider(WatchlistCollectionBrokerService),
        MockProvider(GraphStorageService),
        ...commonTestProviders
      ]
    })
      .overrideComponent(ClientDashboardComponent, {
        set: {
          providers: [
            {
              provide: ACTIONS_CONTEXT,
              useExisting: ClientDashboardComponent
            },
            MockProvider(EXPORT_SETTINGS_SERVICE_TOKEN)
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ClientDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
