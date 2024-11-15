import { DashboardContextService } from '../../../shared/services/dashboard-context.service';
import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';
import { SelectClientPortfolioBtnComponent } from '../select-client-portfolio-btn/select-client-portfolio-btn.component';
import { DashboardModule } from '../../../modules/dashboard/dashboard.module';
import { AsyncPipe } from '@angular/common';
import { WidgetsGalleryNavBtnComponent } from "../../../modules/dashboard/components/widgets-gallery-nav-btn/widgets-gallery-nav-btn.component";
import { map, shareReplay, startWith } from 'rxjs';
import {
  OpenOrdersDialogNavBtnComponent
} from "../../../modules/dashboard/components/open-orders-dialog-nav-btn/open-orders-dialog-nav-btn.component";
import {AdminProfileMenuNavBtnComponent} from "../admin-profile-menu-nav-btn/admin-profile-menu-nav-btn.component";
import {DesktopNavbarComponent} from "../../../modules/dashboard/components/desktop-navbar/desktop-navbar.component";

@Component({
  selector: 'ats-admin-navbar',
  standalone: true,
  imports: [
    SelectClientPortfolioBtnComponent,
    DashboardModule,
    AsyncPipe,
    WidgetsGalleryNavBtnComponent,
    OpenOrdersDialogNavBtnComponent,
    AdminProfileMenuNavBtnComponent,
    DesktopNavbarComponent
  ],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminNavbarComponent {
  readonly isDashboardReady$ = this.dashboardContextService.selectedPortfolio$.pipe(
    map(() => true),
    startWith(false),
    shareReplay(1)
  );

  constructor(
    private readonly dashboardContextService: DashboardContextService
  ) {}
}
