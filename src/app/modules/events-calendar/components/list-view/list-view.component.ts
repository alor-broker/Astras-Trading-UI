import {Component, DestroyRef, Input, OnInit} from '@angular/core';
import { formatCurrency } from "../../../../shared/utils/formatters";
import { CalendarEvents } from "../../models/events-calendar.model";
import { BehaviorSubject, Observable, switchMap } from "rxjs";
import { EventsCalendarService } from "../../services/events-calendar.service";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { addYears, getISOStringDate } from "../../../../shared/utils/datetime";
import { TranslatorService } from "../../../../shared/services/translator.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.less']
})
export class ListViewComponent implements OnInit {
  private symbols$ = new BehaviorSubject<string[]>([]);
  @Input()
  set symbols(value: string[]) {
    this.symbols$.next(value);
  }

  events$ = new BehaviorSubject<CalendarEvents>({});
  activeLang$!: Observable<string>;

  formatCurrencyFn = formatCurrency;

  constructor(
    private readonly service: EventsCalendarService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
) {
  }

  ngOnInit() {
    this.symbols$.pipe(
      switchMap(symbols => this.service.getEvents({
        dateFrom: getISOStringDate(new Date()),
        dateTo: getISOStringDate(addYears(new Date(), 1)),
        symbols
      })),
      takeUntilDestroyed(this.destroyRef)
    )
      .subscribe(e => {
        this.events$.next(e);
      });

    this.activeLang$ = this.translatorService.getLangChanges();
  }

  selectInstrument(symbol: string) {
    this.dashboardContextService.selectDashboardInstrument({ symbol, exchange: 'MOEX' }, defaultBadgeColor);
  }

  isEventsEmpty(events: CalendarEvents) {
    return JSON.stringify(events) === '{}';
  }
}
