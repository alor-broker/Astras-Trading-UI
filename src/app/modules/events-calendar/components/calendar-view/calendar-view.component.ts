import {
  AfterViewInit,
  Component,
  DestroyRef,
  Inject,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { NzCalendarComponent, NzDateFullCellDirective } from "ng-zorro-antd/calendar";
import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  shareReplay,
  switchMap,
  tap
} from "rxjs";
import {CalendarEvent, CalendarEvents} from "../../models/events-calendar.model";
import {EventsCalendarService} from "../../services/events-calendar.service";
import {addMonths, endOfMonth, getISOStringDate, startOfDay, startOfMonth} from "../../../../shared/utils/datetime";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { MarketService } from "../../../../shared/services/market.service";
import {
  CurrencySettings
} from "../../../../shared/models/market-settings.model";
import { map } from "rxjs/operators";
import {
  formatCurrency,
  getCurrencyFormat
} from "../../../../shared/utils/formatters";
import { LetDirective } from '@ngrx/component';
import { NzPopoverDirective } from 'ng-zorro-antd/popover';
import { NzDescriptionsComponent, NzDescriptionsItemComponent } from 'ng-zorro-antd/descriptions';
import { TranslocoDirective } from '@jsverse/transloco';
import { AsyncPipe, DatePipe } from '@angular/common';

@Component({
    selector: 'ats-calendar-view',
    templateUrl: './calendar-view.component.html',
    styleUrls: ['./calendar-view.component.less'],
    imports: [
      LetDirective,
      NzCalendarComponent,
      NzDateFullCellDirective,
      NzPopoverDirective,
      NzDescriptionsComponent,
      TranslocoDirective,
      NzDescriptionsItemComponent,
      AsyncPipe,
      DatePipe
    ]
})
export class CalendarViewComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly symbols$ = new BehaviorSubject<string[]>([]);

  @Input()
  set symbols(value: string[]) {
    this.symbols$.next(value);
  }

  @ViewChild('startPeriodCalendar') startPeriodCalendarComp?: NzCalendarComponent;
  @ViewChild('endPeriodCalendar') endPeriodCalendarComp?: NzCalendarComponent;

  events$ = new BehaviorSubject<CalendarEvents>({});
  selectedDate$ = new BehaviorSubject<Date>(new Date());
  selectedDateEvents$ = new BehaviorSubject<CalendarEvent | null>(null);

  currencySettings$!: Observable<CurrencySettings>;

  constructor(
    private readonly service: EventsCalendarService,
    private readonly marketService: MarketService,
    private readonly destroyRef: DestroyRef,
    @Inject(LOCALE_ID)
    private readonly locale: string
  ) {
  }

  ngOnInit(): void {
    this.currencySettings$ = this.marketService.getMarketSettings().pipe(
      map(s => s.currencies),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  disable = (): boolean => true;

  ngAfterViewInit(): void {
    this.selectedDate$
      .pipe(
        distinctUntilChanged((prev, curr) => prev.toString() === curr.toString()),
        tap(date => this.changeCalendarsDate(date)),
        switchMap(() => this.symbols$),
        switchMap(symbols => this.service.getEvents({
            dateFrom: getISOStringDate(startOfMonth(this.startPeriodCalendarComp!.activeDate.nativeDate)),
            dateTo: getISOStringDate(endOfMonth(this.endPeriodCalendarComp!.activeDate.nativeDate)),
            symbols
          })
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(events => {
        this.events$.next(events);
      });
  }

  ngOnDestroy(): void {
    this.symbols$.complete();
    this.events$.complete();
    this.selectedDateEvents$.complete();
  }

  onDateChange(e: Date): void {
    this.selectedDate$.next(e);
  }

  changeCalendarsDate(date: Date): void {
    this.startPeriodCalendarComp?.writeValue(date);
    this.endPeriodCalendarComp?.writeValue(addMonths(date, 1));
  }

  getDateEvents(date: Date, events: CalendarEvents): CalendarEvent | null {
    return Object
      .values(events)
      .find(event => startOfDay(event.date).toString() === startOfDay(date).toString()) ?? null;
  }

  isShowDate(date: Date, isLeftCalendar = true): boolean {
    if (isLeftCalendar) {
      return date.getMonth() === this.startPeriodCalendarComp?.activeDate.getMonth();
    }

    return date.getMonth() === this.endPeriodCalendarComp?.activeDate.getMonth();
  }

  selectEvent(date: Date, events: CalendarEvents): void {
    const selectedDateEvents = this.getDateEvents(date, events);

    if (selectedDateEvents) {
      this.selectedDateEvents$.next(selectedDateEvents);
    }
  }

  formatCurrencyFn(value: number, currency: string, settings: CurrencySettings): string {
    return formatCurrency(value, this.locale, getCurrencyFormat(currency, settings));
  }
}
