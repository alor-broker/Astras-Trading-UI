import {Component, Input, OnInit} from '@angular/core';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {Observable} from "rxjs";
import {PortfolioSummarySettings} from "../../models/portfolio-summary-settings.model";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {BlotterSettings} from "../../../blotter/models/blotter-settings.model";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";

@Component({
    selector: 'ats-portfolio-summary-widget',
    templateUrl: './portfolio-summary-widget.component.html',
    styleUrls: ['./portfolio-summary-widget.component.less'],
    standalone: false
})
export class PortfolioSummaryWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<PortfolioSummarySettings>;

  readonly currentDashboard$ = this.dashboardContextService.selectedDashboard$;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly manageDashboardService: ManageDashboardsService,
    private readonly dashboardContextService: DashboardContextService,
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  removeWidget($event: MouseEvent | TouchEvent): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.manageDashboardService.removeWidget(this.guid);
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createPortfolioLinkedWidgetSettingsIfMissing<PortfolioSummarySettings>(
      this.widgetInstance,
      'PortfolioSummarySettings',
      settings => ({
        ...settings,
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<BlotterSettings>(this.guid);
  }
}
