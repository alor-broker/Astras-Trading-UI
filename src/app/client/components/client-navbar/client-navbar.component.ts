import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DesktopNavbarComponent } from "../../../modules/dashboard/components/desktop-navbar/desktop-navbar.component";
import { WidgetsGalleryNavBtnComponent } from "../../../modules/dashboard/components/widgets-gallery-nav-btn/widgets-gallery-nav-btn.component";
import { AsyncPipe } from "@angular/common";
import { OpenOrdersDialogNavBtnComponent } from "../../../modules/dashboard/components/open-orders-dialog-nav-btn/open-orders-dialog-nav-btn.component";
import { ClientProfileMenuNavBtnComponent } from "../client-profile-menu-nav-btn/client-profile-menu-nav-btn.component";
import {
  shareReplay,
  startWith
} from "rxjs";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";
import { TranslocoDirective } from "@jsverse/transloco";
import { JoyrideModule } from "ngx-joyride";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { SelectPortfolioMenuNavBtnComponent } from "../select-portfolio-menu-nav-btn/select-portfolio-menu-nav-btn.component";
import { DashboardsPanelComponent } from "../dashboards-panel/dashboards-panel.component";
import { NetworkIndicatorComponent } from "../../../modules/dashboard/components/network-indicator/network-indicator.component";
import { AiChatNavBtnComponent } from "../../../modules/ai-chat/widgets/ai-chat-nav-btn/ai-chat-nav-btn.component";
import { ExternalLinkComponent } from "../../../shared/components/external-link/external-link.component";
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";
import { CurrentTimeComponent } from "../current-time/current-time.component";
import {
  NotificationButtonComponent
} from "../../../modules/notifications/components/notification-button/notification-button.component";

@Component({
    selector: 'ats-client-navbar',
  imports: [
    DesktopNavbarComponent,
    WidgetsGalleryNavBtnComponent,
    AsyncPipe,
    OpenOrdersDialogNavBtnComponent,
    ClientProfileMenuNavBtnComponent,
    TranslocoDirective,
    JoyrideModule,
    SelectPortfolioMenuNavBtnComponent,
    DashboardsPanelComponent,
    NetworkIndicatorComponent,
    AiChatNavBtnComponent,
    ExternalLinkComponent,
    CurrentTimeComponent,
    NotificationButtonComponent
  ],
    templateUrl: './client-navbar.component.html',
    styleUrl: './client-navbar.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientNavbarComponent {
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly environmentService = inject(EnvironmentService);

  readonly externalLinks = this.environmentService.externalLinks;
  readonly terminalSettings$ = this.terminalSettingsService.getSettings();

  readonly selectedDashboard$ = this.dashboardContextService.selectedDashboard$.pipe(
    startWith(null),
    shareReplay(1)
  );
}
