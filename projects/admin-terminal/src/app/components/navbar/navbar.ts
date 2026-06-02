import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {DesktopDashboardContextService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-dashboard-context.service';
import {
  map,
  shareReplay,
  startWith
} from 'rxjs';
import {DesktopNavbar} from '@terminal-core-lib/features/dashboard/desktop/components/desktop-navbar/desktop-navbar';
import {WidgetsGalleryNavBtn} from '@terminal-core-lib/features/widgets-gallery/components/widgets-gallery-nav-btn/widgets-gallery-nav-btn';
import {OpenOrdersDialogNavBtn} from '@terminal-core-lib/features/orders/components/open-orders-dialog-nav-btn/open-orders-dialog-nav-btn';
import {ThemeSwitchNavBtn} from '@terminal-core-lib/features/themes/components/theme-switch-nav-btn/theme-switch-nav-btn';
import {AdminProfileMenuNavBtn} from '../admin-profile-menu-nav-btn/admin-profile-menu-nav-btn';
import {AsyncPipe} from '@angular/common';
import {AdminDashboardsPanel} from '../admin-dashboards-panel/admin-dashboards-panel';

@Component({
  selector: 'atsa-navbar',
  imports: [
    DesktopNavbar,
    WidgetsGalleryNavBtn,
    OpenOrdersDialogNavBtn,
    ThemeSwitchNavBtn,
    AdminProfileMenuNavBtn,
    AsyncPipe,
    AdminDashboardsPanel
  ],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly dashboardContextService = inject(DesktopDashboardContextService);

  readonly isPortfolioSelected$ = this.dashboardContextService.selectedPortfolioOrNull$.pipe(
    map(p => p != null),
    startWith(false),
    shareReplay(1)
  );
}
