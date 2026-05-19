import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {PortfolioSummaryWidgetSettings} from '@terminal-widgets-lib/widgets/portfolio-summary/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {AsyncPipe} from '@angular/common';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {PortfolioSummary} from '@terminal-widgets-lib/widgets/portfolio-summary/components/portfolio-summary/portfolio-summary';

@Component({
  selector: 'ats-portfolio-summary-widget',
  imports: [
    NzButtonComponent,
    AsyncPipe,
    NzIconDirective,
    PortfolioSummary
  ],
  templateUrl: './portfolio-summary-widget.html',
  styleUrl: './portfolio-summary-widget.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioSummaryWidget extends WidgetBase<PortfolioSummaryWidgetSettings> {
  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  readonly currentDashboard$ = this.dashboardContextService.selectedDashboard$;

  private readonly manageDashboardService = inject(DesktopManageDashboardsService);

  removeWidget($event: MouseEvent | TouchEvent): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.manageDashboardService.removeWidget(this.guid);
  }

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createPortfolioLinkedWidgetSettingsIfMissing<PortfolioSummaryWidgetSettings>(
      this.widgetInstance(),
      'PortfolioSummarySettings',
      settings => ({
        ...settings,
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );
  }

}
