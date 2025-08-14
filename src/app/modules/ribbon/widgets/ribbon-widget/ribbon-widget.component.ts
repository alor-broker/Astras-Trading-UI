import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { Observable } from 'rxjs';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { ManageDashboardsService } from '../../../../shared/services/manage-dashboards.service';
import { RibbonSettings } from '../../models/ribbon-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";

@Component({
    selector: 'ats-ribbon-widget',
    templateUrl: './ribbon-widget.component.html',
    styleUrls: ['./ribbon-widget.component.less'],
    standalone: false
})
export class RibbonWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<RibbonSettings>;
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

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<RibbonSettings>(
      this.widgetInstance,
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
