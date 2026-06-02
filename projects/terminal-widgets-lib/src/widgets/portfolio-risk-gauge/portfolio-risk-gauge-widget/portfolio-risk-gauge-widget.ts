import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {PortfolioRiskGaugeWidgetSettings} from '@terminal-widgets-lib/widgets/portfolio-risk-gauge/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {PortfolioRiskGaugeService} from '@terminal-widgets-lib/widgets/portfolio-risk-gauge/services/portfolio-risk-gauge.service';
import {
  Observable,
  shareReplay,
  switchMap
} from 'rxjs';
import {PortfolioRiskGaugeView} from '@terminal-widgets-lib/widgets/portfolio-risk-gauge/types/portfolio-risk-gauge.types';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {AsyncPipe} from '@angular/common';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {PortfolioRiskGauge} from '@terminal-widgets-lib/widgets/portfolio-risk-gauge/components/portfolio-risk-gauge/portfolio-risk-gauge';

@Component({
  selector: 'ats-portfolio-risk-gauge-widget',
  imports: [
    WidgetSkeleton,
    AsyncPipe,
    WidgetHeader,
    PortfolioRiskGauge
  ],
  templateUrl: './portfolio-risk-gauge-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioRiskGaugeWidget extends WidgetBase<PortfolioRiskGaugeWidgetSettings> {
  protected view$!: Observable<PortfolioRiskGaugeView>;

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly portfolioRiskGaugeService = inject(PortfolioRiskGaugeService);

  override ngOnInit(): void {
    super.ngOnInit();
    this.view$ = this.settings$.pipe(
      switchMap(settings => this.portfolioRiskGaugeService.getGaugeView(settings)),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createPortfolioLinkedWidgetSettingsIfMissing<PortfolioRiskGaugeWidgetSettings>(
      this.widgetInstance(),
      'PortfolioRiskGaugeSettings',
      settings => ({
        ...settings
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );
  }
}
