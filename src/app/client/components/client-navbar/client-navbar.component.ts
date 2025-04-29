import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';
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
import { DashboardModule } from "../../../modules/dashboard/dashboard.module";
import { NetworkIndicatorComponent } from "../../../modules/dashboard/components/network-indicator/network-indicator.component";
import { NotificationsModule } from "../../../modules/notifications/notifications.module";
import { AiChatNavBtnComponent } from "../../../modules/ai-chat/widgets/ai-chat-nav-btn/ai-chat-nav-btn.component";
import { ExternalLinkComponent } from "../../../shared/components/external-link/external-link.component";

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
        DashboardModule,
        NetworkIndicatorComponent,
        NotificationsModule,
        AiChatNavBtnComponent,
        ExternalLinkComponent
    ],
    templateUrl: './client-navbar.component.html',
    styleUrl: './client-navbar.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientNavbarComponent {
  readonly externalLinks = this.environmentService.externalLinks;

  readonly selectedDashboard$ = this.dashboardContextService.selectedDashboard$.pipe(
    startWith(null),
    shareReplay(1)
  );

  constructor(
    private readonly dashboardContextService: DashboardContextService,
    private readonly environmentService: EnvironmentService,
  ) {
  }
}
