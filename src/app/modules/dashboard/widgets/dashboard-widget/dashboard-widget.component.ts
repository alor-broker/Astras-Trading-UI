import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Subject } from 'rxjs';
import { OnboardingService } from '../../services/onboarding.service';
import { initWidgetSettings } from '../../../../store/widget-settings/widget-settings.actions';
import { ManageDashboardsActions } from '../../../../store/dashboards/dashboards-actions';
import { PortfoliosActions } from '../../../../store/portfolios/portfolios.actions';
import { Store } from '@ngrx/store';

@Component({
  selector: 'ats-dashboard-widget',
  templateUrl: './dashboard-widget.component.html',
  styleUrls: ['./dashboard-widget.component.less']
})
export class DashboardWidgetComponent implements OnInit, OnDestroy {
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly onboarding: OnboardingService,
    private readonly store: Store
  ) {
  }

  ngOnInit(): void {
    this.onboarding.start();

    this.store.dispatch(initWidgetSettings());
    this.store.dispatch(PortfoliosActions.initPortfolios());
    this.store.dispatch(ManageDashboardsActions.initDashboards());
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
