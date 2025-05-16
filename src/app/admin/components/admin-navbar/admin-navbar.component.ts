import { DashboardContextService } from '../../../shared/services/dashboard-context.service';
import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';
import { DashboardModule } from '../../../modules/dashboard/dashboard.module';
import { AsyncPipe } from '@angular/common';
import { WidgetsGalleryNavBtnComponent } from "../../../modules/dashboard/components/widgets-gallery-nav-btn/widgets-gallery-nav-btn.component";
import { map, shareReplay, startWith } from 'rxjs';
import {
  OpenOrdersDialogNavBtnComponent
} from "../../../modules/dashboard/components/open-orders-dialog-nav-btn/open-orders-dialog-nav-btn.component";
import {AdminProfileMenuNavBtnComponent} from "../admin-profile-menu-nav-btn/admin-profile-menu-nav-btn.component";
import {DesktopNavbarComponent} from "../../../modules/dashboard/components/desktop-navbar/desktop-navbar.component";
import {
  ThemeSwitchWidgetComponent
} from "../../../modules/terminal-settings/widgets/theme-switch-widget/theme-switch-widget.component";
import { AdminDashboardsPanelComponent } from "../admin-dashboards-panel/admin-dashboards-panel.component";

@Component({
  selector: 'ats-admin-navbar',
  imports: [
    DashboardModule,
    AsyncPipe,
    WidgetsGalleryNavBtnComponent,
    OpenOrdersDialogNavBtnComponent,
    AdminProfileMenuNavBtnComponent,
    DesktopNavbarComponent,
    ThemeSwitchWidgetComponent,
    AdminDashboardsPanelComponent,
  ],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminNavbarComponent {
  readonly isPortfolioSelected$ = this.dashboardContextService.selectedPortfolioOrNull$.pipe(
    map(p => p != null),
    startWith(false),
    shareReplay(1)
  );

  readonly dashboardType$ = this.dashboardContextService.selectedDashboard$.pipe(
    map(d => d.type),
    shareReplay({bufferSize: 1, refCount: true})
  );

  constructor(
    private readonly dashboardContextService: DashboardContextService
  ) {}
}
