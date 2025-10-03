import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientDashboardComponent } from './client-dashboard.component';
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
import { InstrumentSelectDialogWidgetComponent } from "../../../modules/instruments/widgets/instrument-select-dialog-widget/instrument-select-dialog-widget.component";
import {GraphStorageService} from "../../../modules/ai-graph/services/graph-storage.service";
import { UrgentNotificationDialogComponent } from "../../../modules/urgent-notifications/components/urgent-notification-dialog/urgent-notification-dialog.component";

describe('ClientDashboardComponent', () => {
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
          ClientNavbarComponent,
          SettingsLoadErrorDialogComponent,
          TerminalSettingsWidgetComponent,
          InstrumentSelectDialogWidgetComponent,
          UrgentNotificationDialogComponent
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
    .compileComponents();

    fixture = TestBed.createComponent(ClientDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
