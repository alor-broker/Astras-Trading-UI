import {Component, DestroyRef, OnInit} from '@angular/core';
import {take} from 'rxjs';
import {OnboardingService} from '../../services/onboarding.service';
import {initWidgetSettings} from '../../../../store/widget-settings/widget-settings.actions';
import {ManageDashboardsActions} from '../../../../store/dashboards/dashboards-actions';
import {PortfoliosActions} from '../../../../store/portfolios/portfolios.actions';
import {Store} from '@ngrx/store';
import {DeviceService} from "../../../../shared/services/device.service";
import {Router} from "@angular/router";
import {
  DashboardSettingsBrokerService
} from "../../../../shared/services/settings-broker/dashboard-settings-broker.service";
import {Actions, ofType} from "@ngrx/effects";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-dashboard-widget',
  templateUrl: './dashboard-widget.component.html',
  styleUrls: ['./dashboard-widget.component.less']
})
export class DashboardWidgetComponent implements OnInit {
  constructor(
    private readonly onboarding: OnboardingService,
    private readonly store: Store,
    private readonly deviceService: DeviceService,
    private readonly router: Router,
    private readonly dashboardSettingsBrokerService: DashboardSettingsBrokerService,
    private readonly destroyRef: DestroyRef,
    private readonly actions$: Actions
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
    this.store.dispatch(initWidgetSettings());
    this.store.dispatch(PortfoliosActions.initPortfolios());


    //----------------------
    this.actions$.pipe(
      ofType(ManageDashboardsActions.saveDashboards),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(action => {
      console.log('save request');
      this.dashboardSettingsBrokerService.saveSettings(action.dashboards).subscribe();
    });

    this.dashboardSettingsBrokerService.readSettings().pipe(
      take(1)
    ).subscribe(dashboards => {
      this.store.dispatch(ManageDashboardsActions.initDashboards({dashboards: dashboards ?? []}));
    });

    this.onboarding.start();
  }
}
