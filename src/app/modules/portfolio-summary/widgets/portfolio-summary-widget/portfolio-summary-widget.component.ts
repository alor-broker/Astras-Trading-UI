import { Component, input, OnInit, inject } from '@angular/core';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {Observable} from "rxjs";
import {PortfolioSummarySettings} from "../../models/portfolio-summary-settings.model";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {BlotterSettings} from "../../../blotter/models/blotter-settings.model";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {PortfolioSummaryComponent} from '../../components/portfolio-summary/portfolio-summary.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-portfolio-summary-widget',
  templateUrl: './portfolio-summary-widget.component.html',
  styleUrls: ['./portfolio-summary-widget.component.less'],
  imports: [
    NzButtonComponent,
    NzIconDirective,
    PortfolioSummaryComponent,
    AsyncPipe
  ]
})
export class PortfolioSummaryWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly manageDashboardService = inject(ManageDashboardsService);
  private readonly dashboardContextService = inject(DashboardContextService);

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<PortfolioSummarySettings>;

  readonly currentDashboard$ = this.dashboardContextService.selectedDashboard$;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  removeWidget($event: MouseEvent | TouchEvent): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.manageDashboardService.removeWidget(this.guid);
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createPortfolioLinkedWidgetSettingsIfMissing<PortfolioSummarySettings>(
      this.widgetInstance(),
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
