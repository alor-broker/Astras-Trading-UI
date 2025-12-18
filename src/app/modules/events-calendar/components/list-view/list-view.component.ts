import {
  Component,
  DestroyRef,
  Inject,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  formatCurrency,
  getCurrencyFormat
} from "../../../../shared/utils/formatters";
import { CalendarEvents } from "../../models/events-calendar.model";
import {
  BehaviorSubject,
  Observable,
  shareReplay,
  switchMap
} from "rxjs";
import { EventsCalendarService } from "../../services/events-calendar.service";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { addYears, getISOStringDate } from "../../../../shared/utils/datetime";
import { TranslatorService } from "../../../../shared/services/translator.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { MarketService } from "../../../../shared/services/market.service";
import { CurrencySettings } from "../../../../shared/models/market-settings.model";
import { map } from "rxjs/operators";
import {
  ACTIONS_CONTEXT,
  ActionsContext
} from "../../../../shared/services/actions-context";
import { LetDirective } from '@ngrx/component';
import { TranslocoDirective } from '@jsverse/transloco';
import { AsyncPipe, DatePipe, KeyValuePipe } from '@angular/common';

@Component({
    selector: 'ats-list-view',
    templateUrl: './list-view.component.html',
    styleUrls: ['./list-view.component.less'],
    imports: [
      LetDirective,
      TranslocoDirective,
      AsyncPipe,
      DatePipe,
      KeyValuePipe
    ]
})
export class ListViewComponent implements OnInit, OnDestroy {
  private readonly symbols$ = new BehaviorSubject<string[]>([]);
  @Input()
  set symbols(value: string[]) {
    this.symbols$.next(value);
  }

  events$ = new BehaviorSubject<CalendarEvents>({});
  activeLang$!: Observable<string>;
  currencySettings$!: Observable<CurrencySettings>;

  constructor(
    private readonly service: EventsCalendarService,
    @Inject(ACTIONS_CONTEXT)
    private readonly actionsContext: ActionsContext,
    private readonly translatorService: TranslatorService,
    private readonly marketService: MarketService,
    private readonly destroyRef: DestroyRef,
    @Inject(LOCALE_ID)
    private readonly locale: string
) {
  }

  ngOnDestroy(): void {
    this.symbols$.complete();
    this.events$.complete();
  }

  ngOnInit(): void {
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

    this.currencySettings$ = this.marketService.getMarketSettings().pipe(
      map(s => s.currencies),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  selectInstrument(symbol: string): void {
    this.actionsContext.selectInstrument({ symbol, exchange: 'MOEX' }, defaultBadgeColor);
  }

  isEventsEmpty(events: CalendarEvents): boolean {
    return JSON.stringify(events) === '{}';
  }

  formatCurrencyFn(value: number, currency: string, settings: CurrencySettings): string {
    return formatCurrency(value, this.locale, getCurrencyFormat(currency, settings));
  }
}
