import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AdminNavbarComponent} from './admin-navbar.component';
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {EMPTY} from "rxjs";
import {MockComponents, MockDirective} from "ng-mocks";
import {
  WidgetsGalleryNavBtnComponent
} from "../../../modules/dashboard/components/widgets-gallery-nav-btn/widgets-gallery-nav-btn.component";
import {
  OpenOrdersDialogNavBtnComponent
} from "../../../modules/dashboard/components/open-orders-dialog-nav-btn/open-orders-dialog-nav-btn.component";
import {AdminProfileMenuNavBtnComponent} from "../admin-profile-menu-nav-btn/admin-profile-menu-nav-btn.component";
import {DesktopNavbarComponent} from "../../../modules/dashboard/components/desktop-navbar/desktop-navbar.component";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {
  ThemeSwitchWidgetComponent
} from "../../../modules/terminal-settings/widgets/theme-switch-widget/theme-switch-widget.component";
import { AdminDashboardsPanelComponent } from "../admin-dashboards-panel/admin-dashboards-panel.component";

describe('AdminNavbarComponent', () => {
  let component: AdminNavbarComponent;
  let fixture: ComponentFixture<AdminNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminNavbarComponent,
        ...MockComponents(
          DesktopNavbarComponent,
          WidgetsGalleryNavBtnComponent,
          OpenOrdersDialogNavBtnComponent,
          AdminProfileMenuNavBtnComponent,
          ThemeSwitchWidgetComponent,
          AdminDashboardsPanelComponent
        ),
        MockDirective(NzIconDirective)
      ],
      providers: [
        {
          provide: DashboardContextService,
          useValue: {
            selectedPortfolioOrNull$: EMPTY,
            selectedDashboard$: EMPTY
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AdminNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
