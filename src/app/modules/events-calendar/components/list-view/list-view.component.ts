import { Component, DestroyRef, input, LOCALE_ID, OnDestroy, OnInit, inject } from '@angular/core';
import {formatCurrency, getCurrencyFormat} from "../../../../shared/utils/formatters";
import {CalendarEvents} from "../../models/events-calendar.model";
import {BehaviorSubject, Observable, shareReplay, switchMap} from "rxjs";
import {EventsCalendarService} from "../../services/events-calendar.service";
import {defaultBadgeColor} from "../../../../shared/utils/instruments";
import {addYears, getISOStringDate} from "../../../../shared/utils/datetime";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {MarketService} from "../../../../shared/services/market.service";
import {CurrencySettings} from "../../../../shared/models/market-settings.model";
import {map} from "rxjs/operators";
import {ACTIONS_CONTEXT, ActionsContext} from "../../../../shared/services/actions-context";
import {LetDirective} from '@ngrx/component';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe, DatePipe, KeyValuePipe} from '@angular/common';

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
  private readonly service = inject(EventsCalendarService);
  private readonly actionsContext = inject<ActionsContext>(ACTIONS_CONTEXT);
  private readonly translatorService = inject(TranslatorService);
  private readonly marketService = inject(MarketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = inject(LOCALE_ID);

  readonly symbols = input<string[]>([]);
  events$ = new BehaviorSubject<CalendarEvents>({});
  activeLang$!: Observable<string>;
  currencySettings$!: Observable<CurrencySettings>;
  private readonly symbolsChanges$ = toObservable(this.symbols);

  ngOnDestroy(): void {
    this.events$.complete();
  }

  ngOnInit(): void {
    this.symbolsChanges$.pipe(
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
    this.actionsContext.selectInstrument({symbol, exchange: 'MOEX'}, defaultBadgeColor);
  }

  isEventsEmpty(events: CalendarEvents): boolean {
    return JSON.stringify(events) === '{}';
  }

  formatCurrencyFn(value: number, currency: string, settings: CurrencySettings): string {
    return formatCurrency(value, this.locale, getCurrencyFormat(currency, settings));
  }
}
