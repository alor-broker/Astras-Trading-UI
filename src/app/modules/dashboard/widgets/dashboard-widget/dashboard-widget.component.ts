import {Component, OnInit} from '@angular/core';
import {take} from 'rxjs';
import {OnboardingService} from '../../services/onboarding.service';
import {Store} from '@ngrx/store';
import {DeviceService} from "../../../../shared/services/device.service";
import {Router} from "@angular/router";
import {DesktopSettingsBrokerService} from "../../services/desktop-settings-broker.service";
import { PortfoliosInternalActions } from "../../../../store/portfolios/portfolios.actions";
import { WidgetsLocalStateInternalActions } from "../../../../store/widgets-local-state/widgets-local-state.actions";
import {
  ACTIONS_CONTEXT,
  ActionsContext
} from "../../../../shared/services/actions-context";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";

@Component({
  selector: 'ats-dashboard-widget',
  templateUrl: './dashboard-widget.component.html',
  styleUrls: ['./dashboard-widget.component.less'],
  providers: [
    {
      provide: ACTIONS_CONTEXT,
      useExisting: DashboardWidgetComponent
    }
  ]
})
export class DashboardWidgetComponent implements OnInit, ActionsContext {
  showSettingsLoadDialog = false;

  constructor(
    private readonly store: Store,
    private readonly onboarding: OnboardingService,
    private readonly deviceService: DeviceService,
    private readonly router: Router,
    private readonly desktopSettingsBrokerService: DesktopSettingsBrokerService,
    private readonly dashboardContextService: DashboardContextService,
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

  instrumentSelected(instrumentKey: InstrumentKey, groupKey: string): void {
    this.dashboardContextService.selectDashboardInstrument(instrumentKey, groupKey);
  }

  private initDashboard(): void {
    this.desktopSettingsBrokerService.initSettingsBrokers({
      onSettingsReadError: () => this.showSettingsLoadDialog = true
    });

    this.store.dispatch(PortfoliosInternalActions.init());
    this.store.dispatch(WidgetsLocalStateInternalActions.init());
    this.onboarding.start();
  }
}
