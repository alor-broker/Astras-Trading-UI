import { Component, Input, OnInit } from '@angular/core';
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { Observable } from "rxjs";
import { EventsCalendarSettings } from "../../models/events-calendar-settings.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";

@Component({
  selector: 'ats-events-calendar-widget',
  templateUrl: './events-calendar-widget.component.html',
  styleUrls: ['./events-calendar-widget.component.less']
})
export class EventsCalendarWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;
  @Input({required: true})
  isBlockWidget!: boolean;

  shouldShowSettings: boolean = false;
  settings$!: Observable<EventsCalendarSettings>;
  constructor(
    private readonly widgetSettingsService: WidgetSettingsService
  ) {}

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<EventsCalendarSettings>(
      this.widgetInstance,
      'EventsCalendarSettings',
      settings => ({
        ...settings
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<EventsCalendarSettings>(this.guid);
  }
}
