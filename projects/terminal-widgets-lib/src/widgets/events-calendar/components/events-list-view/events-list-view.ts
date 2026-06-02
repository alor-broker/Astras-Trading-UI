import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';

import {
  BehaviorSubject,
  Observable,
  shareReplay,
  switchMap
} from "rxjs";
import {EventsCalendarService} from "../../services/events-calendar.service";
import {
  takeUntilDestroyed,
  toObservable
} from "@angular/core/rxjs-interop";
import {map} from "rxjs/operators";
import {LetDirective} from '@ngrx/component';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  AsyncPipe,
  DatePipe,
  KeyValuePipe
} from '@angular/common';
import {CalendarEvents} from '@terminal-widgets-lib/widgets/events-calendar/types/events-calendar.types';
import {
  addYears,
  formatISO
} from 'date-fns';
import {ACTIONS_CONTEXT} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {MarketService} from '@terminal-core-lib/features/market-config/market.service';
import {CurrencySettings} from '@terminal-core-lib/features/market-config/market-config.types';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {CurrencyFormatHelper} from '@terminal-core-lib/common/utils/currency-format.helper';

@Component({
  selector: 'ats-events-list-view',
  templateUrl: './events-list-view.html',
  styleUrls: ['./events-list-view.less'],
  imports: [
    LetDirective,
    TranslocoDirective,
    AsyncPipe,
    DatePipe,
    KeyValuePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EventsListView implements OnInit, OnDestroy {
  readonly symbols = input<string[]>([]);

  events$ = new BehaviorSubject<CalendarEvents>({});

  activeLang$!: Observable<string>;

  currencySettings$!: Observable<CurrencySettings>;

  private readonly service = inject(EventsCalendarService);

  private readonly actionsContext = inject(ACTIONS_CONTEXT);

  private readonly translatorService = inject(TranslatorService);

  private readonly marketService = inject(MarketService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly locale = inject(LOCALE_ID);

  private readonly symbolsChanges$ = toObservable(this.symbols);

  ngOnDestroy(): void {
    this.events$.complete();
  }

  ngOnInit(): void {
    this.symbolsChanges$.pipe(
      switchMap(symbols => this.service.getEvents({
        dateFrom: formatISO(new Date(), {representation: 'date'}),
        dateTo: formatISO(addYears(new Date(), 1), {representation: 'date'}),
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
    this.actionsContext.selectInstrument({symbol, exchange: 'MOEX'}, DefaultBadge);
  }

  isEventsEmpty(events: CalendarEvents): boolean {
    return JSON.stringify(events) === '{}';
  }

  formatCurrencyFn(value: number, currency: string, settings: CurrencySettings): string {
    return CurrencyFormatHelper.formatCurrency(value, this.locale, CurrencyFormatHelper.getCurrencyFormat(currency, settings));
  }
}
