import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {EventsCalendarService} from '@terminal-widgets-lib/widgets/events-calendar/services/events-calendar.service';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {EventsCalendarWidgetSettings} from '@terminal-widgets-lib/widgets/events-calendar/widget-settings';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {EventsCalendar} from '@terminal-widgets-lib/widgets/events-calendar/components/events-calendar/events-calendar';

@Component({
  selector: 'ats-events-calendar-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    EventsCalendar
  ],
  templateUrl: './events-calendar-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EventsCalendarService]
})
export class EventsCalendarWidget extends WidgetBase<EventsCalendarWidgetSettings> {
  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<EventsCalendarWidgetSettings>(
      this.widgetInstance(),
      'EventsCalendarSettings',
      settings => ({
        ...settings
      }),
      this.widgetSettingsService
    );
  }

}
