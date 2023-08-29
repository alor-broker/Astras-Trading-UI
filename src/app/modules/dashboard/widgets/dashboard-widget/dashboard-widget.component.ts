import {Component, OnInit} from '@angular/core';
import {take} from 'rxjs';
import {OnboardingService} from '../../services/onboarding.service';
import {PortfoliosActions} from '../../../../store/portfolios/portfolios.actions';
import {Store} from '@ngrx/store';
import {DeviceService} from "../../../../shared/services/device.service";
import {Router} from "@angular/router";
import {DesktopSettingsBrokerService} from "../../services/desktop-settings-broker.service";

@Component({
  selector: 'ats-dashboard-widget',
  templateUrl: './dashboard-widget.component.html',
  styleUrls: ['./dashboard-widget.component.less']
})
export class DashboardWidgetComponent implements OnInit {
  constructor(
    private readonly store: Store,
    private readonly onboarding: OnboardingService,
    private readonly deviceService: DeviceService,
    private readonly router: Router,
    private readonly desktopSettingsBrokerService: DesktopSettingsBrokerService
  ) {
  }

  ngOnInit(): void {
    this.deviceService.deviceInfo$
      .pipe(take(1))
      .subscribe(info => {
        if (info.isMobile) {
          this.router.navigate(['mobile']);
          return;
        }

        this.initDashboard();
      });

  }

  private initDashboard() {
    this.desktopSettingsBrokerService.initSettingsBrokers();
    this.store.dispatch(PortfoliosActions.initPortfolios());
    this.onboarding.start();
  }
}
