import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from "rxjs";
import { OnboardingService } from "../../services/onboarding.service";
import { Store } from "@ngrx/store";
import { initWidgetSettings } from "../../../../store/widget-settings/widget-settings.actions";
import { PortfoliosActions } from "../../../../store/portfolios/portfolios.actions";
import { MobileDashboardActions } from "../../../../store/mobile-dashboard/mobile-dashboard-actions";
import { MobileDashboardService } from "../../services/mobile-dashboard.service";

@Component({
  selector: 'ats-mobile-dashboard-widget',
  templateUrl: './mobile-dashboard-widget.component.html',
  styleUrls: ['./mobile-dashboard-widget.component.less']
})
export class MobileDashboardWidgetComponent implements OnInit, OnDestroy {
  private destroy$: Subject<boolean> = new Subject<boolean>();

  screenHeight!: Observable<number>;

  constructor(
    private readonly onboarding: OnboardingService,
    private readonly store: Store,
    private readonly mobileDashboardService: MobileDashboardService
  ) {
  }

  ngOnInit(): void {
    this.store.dispatch(initWidgetSettings());
    this.store.dispatch(PortfoliosActions.initPortfolios());
    this.store.dispatch(MobileDashboardActions.initMobileDashboard());
    this.screenHeight = this.mobileDashboardService.getScreenHeight();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
