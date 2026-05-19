import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {TerminalSettingsService} from '@terminal-core-lib/features/terminal-settings/services/terminal-settings.service';
import {
  EXTERNAL_LINKS_CONFIG,
  ExternalLinksConfig
} from '@terminal-core-lib/features/external-links/external-links.types';
import {
  shareReplay,
  startWith
} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {TranslocoDirective} from '@jsverse/transloco';
import {DesktopNavbar} from '@terminal-core-lib/features/dashboard/desktop/components/desktop-navbar/desktop-navbar';
import {DesktopDashboardContextService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-dashboard-context.service';
import {WidgetsGalleryNavBtn} from '@terminal-core-lib/features/widgets-gallery/components/widgets-gallery-nav-btn/widgets-gallery-nav-btn';
import {OpenOrdersDialogNavBtn} from '@terminal-core-lib/features/orders/components/open-orders-dialog-nav-btn/open-orders-dialog-nav-btn';
import {SelectPortfolioMenuNavBtn} from '@terminal-core-lib/features/dashboard/common/components/select-portfolio-menu-nav-btn/select-portfolio-menu-nav-btn';
import {DashboardsPanel} from '../dashboards-panel/dashboards-panel';
import {CurrentTime} from '@terminal-core-lib/features/dashboard/common/components/current-time/current-time';
import {NetworkIndicator} from '@terminal-core-lib/features/network-indicator/components/network-indicator/network-indicator';
import {NotificationsNavBtn} from '@terminal-core-lib/features/header-notifications/components/notifications-nav-btn/notifications-nav-btn';
import {AiChatNavBtn} from '../../features/ai-chat/components/ai-chat-nav-btn/ai-chat-nav-btn';
import {ProfileMenuNavBtn} from '../profile-menu-nav-btn/profile-menu-nav-btn';

@Component({
  selector: 'atsd-navbar',
  imports: [
    AsyncPipe,
    TranslocoDirective,
    DesktopNavbar,
    WidgetsGalleryNavBtn,
    OpenOrdersDialogNavBtn,
    SelectPortfolioMenuNavBtn,
    DashboardsPanel,
    CurrentTime,
    NetworkIndicator,
    NotificationsNavBtn,
    AiChatNavBtn,
    ProfileMenuNavBtn
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class Navbar {
  protected readonly externalLinksConfig = inject<ExternalLinksConfig>(EXTERNAL_LINKS_CONFIG);

  private readonly dashboardContextService = inject(DesktopDashboardContextService);

  protected readonly selectedDashboard$ = this.dashboardContextService.selectedDashboard$.pipe(
    startWith(null),
    shareReplay(1)
  );

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  readonly terminalSettings$ = this.terminalSettingsService.getSettings();
}
