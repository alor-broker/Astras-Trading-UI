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

@Component({
  selector: 'ats-ribbon-widget[guid][isBlockWidget]',
  templateUrl: './ribbon-widget.component.html',
  styleUrls: ['./ribbon-widget.component.less']
})
export class RibbonWidgetComponent implements OnInit {
  shouldShowSettings: boolean = false;

  @Input()
  guid!: string;
  @Input()
  isBlockWidget!: boolean;

  settings$!: Observable<RibbonSettings>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly manageDashboardService: ManageDashboardsService,
  ) {
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<RibbonSettings>(
      this.guid,
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
