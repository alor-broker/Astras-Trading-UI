import { DashboardContextService } from '../../../shared/services/dashboard-context.service';
import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { SelectClientPortfolioBtnComponent } from '../select-client-portfolio-btn/select-client-portfolio-btn.component';
import { NzIconDirective } from 'ng-zorro-antd/icon';
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
    TranslocoDirective,
    SelectClientPortfolioBtnComponent,
    NzIconDirective,
    DashboardModule,
    AsyncPipe,
    WidgetsGalleryNavBtnComponent,
    OpenOrdersDialogNavBtnComponent,
    AdminProfileMenuNavBtnComponent,
    DesktopNavbarComponent
  ],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.less',
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
