import { Component, Input, OnInit } from '@angular/core';
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { Observable } from "rxjs";
import { EventsCalendarSettings } from "../../models/events-calendar-settings.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import { TranslocoDirective } from '@jsverse/transloco';
import { WidgetSkeletonComponent } from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import { WidgetHeaderComponent } from '../../../../shared/components/widget-header/widget-header.component';
import { EventsCalendarComponent } from '../../components/events-calendar/events-calendar.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'ats-events-calendar-widget',
    templateUrl: './events-calendar-widget.component.html',
    styleUrls: ['./events-calendar-widget.component.less'],
    imports: [
      TranslocoDirective,
      WidgetSkeletonComponent,
      WidgetHeaderComponent,
      EventsCalendarComponent,
      AsyncPipe
    ]
})
export class EventsCalendarWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  shouldShowSettings = false;
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
