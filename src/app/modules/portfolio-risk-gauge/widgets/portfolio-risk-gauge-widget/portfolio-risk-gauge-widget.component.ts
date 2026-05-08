import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {
  distinctUntilChanged,
  Observable,
  shareReplay,
  switchMap
} from "rxjs";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {isEqualPortfolioDependedSettings} from "../../../../shared/utils/settings-helper";
import {PortfolioRiskGaugeComponent} from "../../components/portfolio-risk-gauge/portfolio-risk-gauge.component";
import {
  PortfolioRiskGaugeWidgetSettings
} from "../../models/portfolio-risk-gauge-settings.model";
import {PortfolioRiskGaugeView} from "../../models/portfolio-risk-gauge.model";
import {PortfolioRiskGaugeService} from "../../services/portfolio-risk-gauge.service";

@Component({
  selector: 'ats-portfolio-risk-gauge-widget',
  imports: [
    AsyncPipe,
    PortfolioRiskGaugeComponent,
    WidgetHeaderComponent,
    WidgetSkeletonComponent
  ],
  templateUrl: './portfolio-risk-gauge-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class PortfolioRiskGaugeWidgetComponent implements OnInit {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<PortfolioRiskGaugeWidgetSettings>;

  view$!: Observable<PortfolioRiskGaugeView>;

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly dashboardContextService = inject(DashboardContextService);

  private readonly portfolioRiskGaugeService = inject(PortfolioRiskGaugeService);

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createPortfolioLinkedWidgetSettingsIfMissing<PortfolioRiskGaugeWidgetSettings>(
      this.widgetInstance(),
      'PortfolioRiskGaugeSettings',
      settings => ({
        ...settings
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<PortfolioRiskGaugeWidgetSettings>(this.guid).pipe(
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
