import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { NzCalendarComponent } from "ng-zorro-antd/calendar";
import { BehaviorSubject, distinctUntilChanged, switchMap } from "rxjs";
import { CalendarEvent, CalendarEvents } from "../../models/events-calendar.model";
import { EventsCalendarService } from "../../services/events-calendar.service";
import { formatCurrency } from "../../../../shared/utils/formatters";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { endOfMonth, getISOStringDate, startOfDay, startOfMonth } from "../../../../shared/utils/datetime";

@Component({
  selector: 'ats-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.less']
})
export class CalendarViewComponent implements AfterViewInit {
  private symbols$ = new BehaviorSubject<string[]>([]);
  @Input()
  set symbols(value: string[]) {
    this.symbols$.next(value);
  }

  @ViewChild('leftCalendar') leftCalendarComp!: NzCalendarComponent;
  @ViewChild('rightCalendar') rightCalendarComp!: NzCalendarComponent;

  events$ = new BehaviorSubject<CalendarEvents>({});
  selectedMonthSub = new BehaviorSubject<number>(new Date().getMonth());
  selectedDateEvents$ = new BehaviorSubject<CalendarEvent | null>(null);

  constructor(
    private readonly service: EventsCalendarService
  ) {
  }

  formatCurrencyFn = formatCurrency;

  disable = () => true;

  ngAfterViewInit() {
    this.leftCalendarComp.onMonthSelect(new Date().getMonth());
    this.rightCalendarComp.onMonthSelect(new Date().getMonth() + 1);

    this.selectedMonthSub
      .pipe(
        distinctUntilChanged((prev, curr) => prev === curr),
        mapWith(
          () => this.symbols$.pipe(
            switchMap(symbols => this.service.getEvents({
              dateFrom: getISOStringDate(startOfMonth(this.leftCalendarComp.activeDate.nativeDate)),
              dateTo: getISOStringDate(endOfMonth(this.rightCalendarComp.activeDate.nativeDate)),
              symbols
            }))
          ),
          (month, events) => ({ month, events })
        )
      )
      .subscribe(({ month, events }) => {
        this.events$.next(events);
        this.leftCalendarComp?.onMonthSelect(month);
        this.rightCalendarComp?.onMonthSelect(month + 1);
      });
  }

  onLeftValueChange(e: Date) {
    this.selectedMonthSub.next(e.getMonth());
  }

  onRightValueChange(e: Date) {
    this.selectedMonthSub.next(e.getMonth() - 1);
  }

  getDateEvents(date: Date, events: CalendarEvents): CalendarEvent | null {
    return Object
      .entries(events)
      .find(([eventDate]) => {
        return startOfDay(new Date(eventDate))?.toString() === startOfDay(date).toString();
      })
      ?.[1] ?? null;
  }

  isShowDate(date: Date, isLeftCalendar = true): boolean {
    if (isLeftCalendar) {
      return date.getMonth() === this.leftCalendarComp?.activeDate.getMonth();
    }

    return date.getMonth() === this.rightCalendarComp?.activeDate.getMonth();
  }

  selectEvent(date: Date, events: CalendarEvents) {
    const selectedDateEvents = this.getDateEvents(date, events);

    if (selectedDateEvents) {
      this.selectedDateEvents$.next(selectedDateEvents);
    }
  }
}
