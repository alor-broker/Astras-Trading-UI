import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientDashboardComponent } from './client-dashboard.component';
import {StoreModule} from "@ngrx/store";
import {EffectsModule} from "@ngrx/effects";
import {DashboardsFeature} from "../../../store/dashboards/dashboards.reducer";
import {OnboardingService} from "../../../modules/dashboard/services/onboarding.service";
import {DesktopSettingsBrokerService} from "../../../modules/dashboard/services/desktop-settings-broker.service";
import {commonTestProviders} from "../../../shared/utils/testing/common-test-providers";
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";
import {MockComponents} from "ng-mocks";
import {ClientNavbarComponent} from "../../components/client-navbar/client-navbar.component";
import {
  SettingsLoadErrorDialogComponent
} from "../../../modules/dashboard/components/settings-load-error-dialog/settings-load-error-dialog.component";
import {
  TerminalSettingsWidgetComponent
} from "../../../modules/terminal-settings/widgets/terminal-settings-widget/terminal-settings-widget.component";
import {RouterModule} from "@angular/router";

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
          TerminalSettingsWidgetComponent
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
