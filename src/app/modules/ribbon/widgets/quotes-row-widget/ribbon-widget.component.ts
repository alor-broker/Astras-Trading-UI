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

@Component({
  selector: 'ats-ribbon-widget[widgetInstance][isBlockWidget]',
  templateUrl: './ribbon-widget.component.html',
  styleUrls: ['./ribbon-widget.component.less']
})
export class RibbonWidgetComponent implements OnInit {
  shouldShowSettings: boolean = false;

  @Input()
  widgetInstance!: WidgetInstance;
  @Input()
  isBlockWidget!: boolean;

  settings$!: Observable<RibbonSettings>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly manageDashboardService: ManageDashboardsService,
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

  switchSettings($event: MouseEvent | null) {
    $event?.preventDefault();
    $event?.stopPropagation();
    this.shouldShowSettings = !this.shouldShowSettings;
  }
}
