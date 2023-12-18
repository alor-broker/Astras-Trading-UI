import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventsCalendarWidgetComponent } from './widgets/events-calendar-widget/events-calendar-widget.component';
import { EventsCalendarComponent } from './components/events-calendar/events-calendar.component';
import { SharedModule } from "../../shared/shared.module";
import { NzCalendarModule } from "ng-zorro-antd/calendar";
import { CalendarViewComponent } from './components/calendar-view/calendar-view.component';
import { ListViewComponent } from './components/list-view/list-view.component';
import { LetDirective } from "@ngrx/component";


@NgModule({
  declarations: [
    EventsCalendarWidgetComponent,
    EventsCalendarComponent,
    CalendarViewComponent,
    ListViewComponent
  ],
  exports: [
    EventsCalendarWidgetComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    NzCalendarModule,
    LetDirective
  ]
})
export class EventsCalendarModule {
}
