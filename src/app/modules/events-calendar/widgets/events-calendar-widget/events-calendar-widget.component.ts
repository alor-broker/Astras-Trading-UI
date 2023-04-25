import { Component, Input, OnInit } from '@angular/core';
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { Observable } from "rxjs";
import { EventsCalendarSettings } from "../../models/events-calendar-settings.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";

@Component({
  selector: 'ats-events-calendar-widget[guid][isBlockWidget]',
  templateUrl: './events-calendar-widget.component.html',
  styleUrls: ['./events-calendar-widget.component.less']
})
export class EventsCalendarWidgetComponent implements OnInit {
  @Input() guid!: string;
  @Input() isBlockWidget!: boolean;

  shouldShowSettings: boolean = false;
  settings$!: Observable<EventsCalendarSettings>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly manageDashboardService: ManageDashboardsService,
  ) {}

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<EventsCalendarSettings>(
      this.guid,
      'RibbonSettings',
      settings => ({
        ...settings
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<EventsCalendarSettings>(this.guid);
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
