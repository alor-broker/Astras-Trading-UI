import { Component, Input, OnInit } from '@angular/core';
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { Observable } from "rxjs";
import { EventsCalendarSettings } from "../../models/events-calendar-settings.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";

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
    private readonly widgetSettingsService: WidgetSettingsService
  ) {}

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<EventsCalendarSettings>(
      this.guid,
      'EventsCalendarSettings',
      settings => ({
        ...settings
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<EventsCalendarSettings>(this.guid);
  }
}
