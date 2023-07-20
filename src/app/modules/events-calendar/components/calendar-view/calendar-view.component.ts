import {AfterViewInit, Component, DestroyRef, Input, OnDestroy, ViewChild} from '@angular/core';
import {NzCalendarComponent} from "ng-zorro-antd/calendar";
import {BehaviorSubject, distinctUntilChanged, switchMap, tap} from "rxjs";
import {CalendarEvent, CalendarEvents} from "../../models/events-calendar.model";
import {EventsCalendarService} from "../../services/events-calendar.service";
import {formatCurrency} from "../../../../shared/utils/formatters";
import {addMonths, endOfMonth, getISOStringDate, startOfDay, startOfMonth} from "../../../../shared/utils/datetime";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.less']
})
export class CalendarViewComponent implements AfterViewInit, OnDestroy {
  private symbols$ = new BehaviorSubject<string[]>([]);

  @Input()
  set symbols(value: string[]) {
    this.symbols$.next(value);
  }

  @ViewChild('startPeriodCalendar') startPeriodCalendarComp!: NzCalendarComponent;
  @ViewChild('endPeriodCalendar') endPeriodCalendarComp!: NzCalendarComponent;

  events$ = new BehaviorSubject<CalendarEvents>({});
  selectedDate$ = new BehaviorSubject<Date>(new Date());
  selectedDateEvents$ = new BehaviorSubject<CalendarEvent | null>(null);

  constructor(
    private readonly service: EventsCalendarService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  formatCurrencyFn = formatCurrency;

  disable = () => true;

  ngAfterViewInit() {
    this.selectedDate$
      .pipe(
        distinctUntilChanged((prev, curr) => prev.toString() === curr.toString()),
        tap(date => this.changeCalendarsDate(date)),
        switchMap(() => this.symbols$),
        switchMap(symbols => this.service.getEvents({
            dateFrom: getISOStringDate(startOfMonth(this.startPeriodCalendarComp.activeDate.nativeDate)),
            dateTo: getISOStringDate(endOfMonth(this.endPeriodCalendarComp.activeDate.nativeDate)),
            symbols
          })
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(events => {
        this.events$.next(events);
      });
  }

  ngOnDestroy() {
    this.symbols$.complete();
    this.events$.complete();
    this.selectedDateEvents$.complete();
  }

  onDateChange(e: Date) {
    this.selectedDate$.next(e);
  }

  changeCalendarsDate(date: Date) {
    this.startPeriodCalendarComp?.writeValue(date);
    this.endPeriodCalendarComp?.writeValue(addMonths(date, 1));
  }

  getDateEvents(date: Date, events: CalendarEvents): CalendarEvent | null {
    return Object
      .values(events)
      .find(event => startOfDay(event.date)?.toString() === startOfDay(date)?.toString()) ?? null;
  }

  isShowDate(date: Date, isLeftCalendar = true): boolean {
    if (isLeftCalendar) {
      return date.getMonth() === this.startPeriodCalendarComp?.activeDate.getMonth();
    }

    return date.getMonth() === this.endPeriodCalendarComp?.activeDate.getMonth();
  }

  selectEvent(date: Date, events: CalendarEvents) {
    const selectedDateEvents = this.getDateEvents(date, events);

    if (selectedDateEvents) {
      this.selectedDateEvents$.next(selectedDateEvents);
    }
  }
}
