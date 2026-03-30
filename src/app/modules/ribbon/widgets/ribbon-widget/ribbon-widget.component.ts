import { Component, OnInit, input, inject } from '@angular/core';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {Observable} from 'rxjs';
import {WidgetSettingsCreationHelper} from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import {ManageDashboardsService} from '../../../../shared/services/manage-dashboards.service';
import {RibbonSettings} from '../../models/ribbon-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {RibbonComponent} from '../../components/ribbon/ribbon.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-ribbon-widget',
  templateUrl: './ribbon-widget.component.html',
  styleUrls: ['./ribbon-widget.component.less'],
  imports: [
    NzButtonComponent,
    NzIconDirective,
    RibbonComponent,
    AsyncPipe
  ]
})
export class RibbonWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly manageDashboardService = inject(ManageDashboardsService);
  private readonly dashboardContextService = inject(DashboardContextService);

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<RibbonSettings>;
  readonly currentDashboard$ = this.dashboardContextService.selectedDashboard$;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<RibbonSettings>(
      this.widgetInstance(),
      'RibbonSettings',
      settings => ({
        ...settings
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<RibbonSettings>(this.guid);
  }

  removeWidget($event: MouseEvent | TouchEvent): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.manageDashboardService.removeWidget(this.guid);
  }
}
