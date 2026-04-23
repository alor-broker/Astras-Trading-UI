import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  distinctUntilChanged,
  Observable,
  shareReplay,
  switchMap
} from "rxjs";
import { WidgetHeaderComponent } from "../../../../shared/components/widget-header/widget-header.component";
import { WidgetSkeletonComponent } from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { isEqualPortfolioDependedSettings } from "../../../../shared/utils/settings-helper";
import { PortfolioRiskGaugeComponent } from "../../components/portfolio-risk-gauge/portfolio-risk-gauge.component";
import { PortfolioRiskGaugeSettings } from "../../models/portfolio-risk-gauge-settings.model";
import { PortfolioRiskGaugeView } from "../../models/portfolio-risk-gauge.model";
import { PortfolioRiskGaugeService } from "../../services/portfolio-risk-gauge.service";

@Component({
  selector: 'ats-portfolio-risk-gauge-widget',
  imports: [
    AsyncPipe,
    PortfolioRiskGaugeComponent,
    WidgetHeaderComponent,
    WidgetSkeletonComponent
  ],
  templateUrl: './portfolio-risk-gauge-widget.component.html',
  styleUrls: ['./portfolio-risk-gauge-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioRiskGaugeWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly portfolioRiskGaugeService = inject(PortfolioRiskGaugeService);

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<PortfolioRiskGaugeSettings>;

  view$!: Observable<PortfolioRiskGaugeView>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createPortfolioLinkedWidgetSettingsIfMissing<PortfolioRiskGaugeSettings>(
      this.widgetInstance(),
      'PortfolioRiskGaugeSettings',
      settings => ({
        ...settings
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<PortfolioRiskGaugeSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) =>
        isEqualPortfolioDependedSettings(previous, current)
        && previous.marketType === current.marketType
      ),
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.view$ = this.settings$.pipe(
      switchMap(settings => this.portfolioRiskGaugeService.getGaugeView(settings)),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }
}
