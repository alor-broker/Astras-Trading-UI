import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ClientNavbarComponent} from './client-navbar.component';
import {MockComponents, MockProvider} from "ng-mocks";
import {DesktopNavbarComponent} from "../../../modules/dashboard/components/desktop-navbar/desktop-navbar.component";
import {
  WidgetsGalleryNavBtnComponent
} from "../../../modules/dashboard/components/widgets-gallery-nav-btn/widgets-gallery-nav-btn.component";
import {
  OpenOrdersDialogNavBtnComponent
} from "../../../modules/dashboard/components/open-orders-dialog-nav-btn/open-orders-dialog-nav-btn.component";
import {ClientProfileMenuNavBtnComponent} from "../client-profile-menu-nav-btn/client-profile-menu-nav-btn.component";
import {
  SelectPortfolioMenuNavBtnComponent
} from "../select-portfolio-menu-nav-btn/select-portfolio-menu-nav-btn.component";
import {DashboardsPanelComponent} from "../dashboards-panel/dashboards-panel.component";
import {
  NetworkIndicatorComponent
} from "../../../modules/dashboard/components/network-indicator/network-indicator.component";
import {AiChatNavBtnComponent} from "../../../modules/ai-chat/widgets/ai-chat-nav-btn/ai-chat-nav-btn.component";
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {EMPTY} from "rxjs";
import {EnvironmentService} from "../../../shared/services/environment.service";
import { CurrentTimeComponent } from "../current-time/current-time.component";
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";
import {
  NotificationButtonComponent
} from "../../../modules/notifications/components/notification-button/notification-button.component";

describe('ClientNavbarComponent', () => {
  let component: ClientNavbarComponent;
  let fixture: ComponentFixture<ClientNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ClientNavbarComponent,
        MockComponents(
          DesktopNavbarComponent,
          WidgetsGalleryNavBtnComponent,
          OpenOrdersDialogNavBtnComponent,
          ClientProfileMenuNavBtnComponent,
          SelectPortfolioMenuNavBtnComponent,
          DashboardsPanelComponent,
          NetworkIndicatorComponent,
          AiChatNavBtnComponent,
          CurrentTimeComponent,
          NotificationButtonComponent
        )
      ],
      providers: [
        MockProvider(
          DashboardContextService,
          {
            selectedDashboard$: EMPTY
          }
        ),
        MockProvider(
          EnvironmentService,
          {
            externalLinks: {
              reports: '',
              releases: '',
              support: '',
              issuesList: '',
              help: '',
              officialSite: '',
              riskRate: '',
              personalAccount: '',
              bankroll: '',
              services: '',
              videoTutorial: ''
            }
          }
        ),
        MockProvider(
          TerminalSettingsService,
          {
            getSettings: () => EMPTY
          }
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ClientNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
