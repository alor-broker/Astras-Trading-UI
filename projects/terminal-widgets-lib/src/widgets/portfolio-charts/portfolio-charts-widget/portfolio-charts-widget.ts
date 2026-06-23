import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {PortfolioChartsWidgetSettings} from '@terminal-widgets-lib/widgets/portfolio-charts/widget-settings.types';
import {
  map,
  Observable
} from 'rxjs';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {AsyncPipe} from '@angular/common';
import {AgreementDynamics} from '@terminal-widgets-lib/widgets/portfolio-charts/components/agreement-dynamics/agreement-dynamics';
import {PortfolioCommissionsChart} from '@terminal-widgets-lib/widgets/portfolio-charts/components/portfolio-commissions-chart/portfolio-commissions-chart';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';

enum PortfolioChartType {
  AgreementDynamics = 'agreementDynamics',
  Commissions = 'commissions',
}

interface PortfolioChartsView {
  portfolioKey: PortfolioKey;
}

@Component({
  selector: 'ats-portfolio-charts-widget',
  imports: [
    TranslocoDirective,
    WidgetSkeleton,
    WidgetHeader,
    AsyncPipe,
    AgreementDynamics,
    PortfolioCommissionsChart,
    NzButtonComponent
  ],
  templateUrl: './portfolio-charts-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioChartsWidget extends WidgetBase<PortfolioChartsWidgetSettings> {
  title$!: Observable<string>;

  settingsView$!: Observable<PortfolioChartsView>;

  readonly selectedChart = signal<PortfolioChartType>(PortfolioChartType.AgreementDynamics);

  readonly availableCharts = Object.values(PortfolioChartType);

  readonly chartTypes = PortfolioChartType;

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  override ngOnInit(): void {
    super.ngOnInit();

    this.settingsView$ = this.settings$.pipe(
      map(settings => ({
        portfolioKey: {
          portfolio: settings.portfolio,
          exchange: settings.exchange
        }
      }))
    );

    this.title$ = this.settings$.pipe(
      map(s => `${s.portfolio} (${s.exchange})`)
    );
  }

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createPortfolioLinkedWidgetSettingsIfMissing<PortfolioChartsWidgetSettings>(
      this.widgetInstance(),
      'PortfolioChartsSettings',
      settings => ({
        ...settings,
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );
  }

  selectChart(chart: PortfolioChartType): void {
    this.selectedChart.set(chart);
  }
}
