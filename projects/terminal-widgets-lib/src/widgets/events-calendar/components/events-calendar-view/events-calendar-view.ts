import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {
  NzCalendarComponent,
  NzDateFullCellDirective
} from "ng-zorro-antd/calendar";
import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  shareReplay,
  switchMap,
  tap
} from "rxjs";
import {EventsCalendarService} from "../../services/events-calendar.service";
import {
  takeUntilDestroyed,
  toObservable
} from "@angular/core/rxjs-interop";
import {map} from "rxjs/operators";
import {LetDirective} from '@ngrx/component';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {
  NzDescriptionsComponent,
  NzDescriptionsItemComponent
} from 'ng-zorro-antd/descriptions';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  AsyncPipe,
  DatePipe
} from '@angular/common';
import {
  CalendarEvent,
  CalendarEvents
} from '@terminal-widgets-lib/widgets/events-calendar/types/events-calendar.types';
import {CurrencySettings} from '@terminal-core-lib/features/market-config/market-config.types';
import {CurrencyFormatHelper} from '@terminal-core-lib/common/utils/currency-format.helper';
import {MarketService} from '@terminal-core-lib/features/market-config/market.service';
import {
  addMonths,
  endOfMonth,
  formatISO,
  startOfDay,
  startOfMonth
} from 'date-fns';

@Component({
  selector: 'ats-events-calendar-view',
  templateUrl: './events-calendar-view.html',
  styleUrls: ['./events-calendar-view.less'],
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CalendarViewComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly symbols = input<string[]>([]);

  readonly startPeriodCalendarComp = viewChild<NzCalendarComponent>('startPeriodCalendar');

  readonly endPeriodCalendarComp = viewChild<NzCalendarComponent>('endPeriodCalendar');

  events$ = new BehaviorSubject<CalendarEvents>({});

  selectedDate$ = new BehaviorSubject<Date>(new Date());

  selectedDateEvents$ = new BehaviorSubject<CalendarEvent | null>(null);

  currencySettings$!: Observable<CurrencySettings>;

  private readonly service = inject(EventsCalendarService);

  private readonly marketService = inject(MarketService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly locale = inject(LOCALE_ID);

  private readonly symbolsChanges$ = toObservable(this.symbols);

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
        switchMap(() => this.symbolsChanges$),
        switchMap(symbols => this.service.getEvents({
            dateFrom: formatISO(startOfMonth(this.startPeriodCalendarComp()!.activeDate.nativeDate), {representation: 'date'}),
            dateTo: formatISO(endOfMonth(this.endPeriodCalendarComp()!.activeDate.nativeDate), {representation: 'date'}),
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
    this.events$.complete();
    this.selectedDate$.complete();
    this.selectedDateEvents$.complete();
  }

  onDateChange(e: Date): void {
    this.selectedDate$.next(e);
  }

  changeCalendarsDate(date: Date): void {
    this.startPeriodCalendarComp()?.writeValue(date);
    this.endPeriodCalendarComp()?.writeValue(addMonths(date, 1));
  }

  getDateEvents(date: Date, events: CalendarEvents): CalendarEvent | null {
    return Object
      .values(events)
      .find(event => startOfDay(event.date).toString() === startOfDay(date).toString()) ?? null;
  }

  isShowDate(date: Date, isLeftCalendar = true): boolean {
    if (isLeftCalendar) {
      return date.getMonth() === this.startPeriodCalendarComp()?.activeDate.getMonth();
    }

    return date.getMonth() === this.endPeriodCalendarComp()?.activeDate.getMonth();
  }

  selectEvent(date: Date, events: CalendarEvents): void {
    const selectedDateEvents = this.getDateEvents(date, events);

    if (selectedDateEvents) {
      this.selectedDateEvents$.next(selectedDateEvents);
    }
  }

  formatCurrencyFn(value: number, currency: string, settings: CurrencySettings): string {
    return CurrencyFormatHelper.formatCurrency(value, this.locale, CurrencyFormatHelper.getCurrencyFormat(currency, settings));
  }
}
