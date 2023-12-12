import {
  Component, DestroyRef,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DatePipe } from "@angular/common";
import { startOfDay, toUnixTimestampSeconds } from "../../../../shared/utils/datetime";
import { filter, map, tap, bufferTime } from "rxjs/operators";
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  shareReplay,
  take,
  withLatestFrom
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { ContentSize } from '../../../../shared/models/dashboard/dashboard-item.model';
import { AllTradesSettings } from '../../models/all-trades-settings.model';
import {
  AllTradesFilters,
  AllTradesItem
} from '../../../../shared/models/all-trades.model';
import { AllTradesService } from '../../../../shared/services/all-trades.service';
import { TableConfig } from '../../../../shared/models/table-config.model';
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TimezoneConverter } from "../../../../shared/utils/timezone-converter";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Side } from "../../../../shared/models/enums/side.model";

@Component({
  selector: 'ats-all-trades',
  templateUrl: './all-trades.component.html',
  styleUrls: ['./all-trades.component.less'],
})
export class AllTradesComponent implements OnInit, OnDestroy {
  @Input({required: true})
  guid!: string;

  contentSize$ = new BehaviorSubject<ContentSize | null>(null);
  private readonly datePipe = new DatePipe('ru-RU');
  private readonly maxItemsInRequestWithPeriod = 50;
  private settings$!: Observable<AllTradesSettings>;

  public tableContainerHeight = 0;
  public tableContainerWidth = 0;

  public readonly isLoading$ = new BehaviorSubject<boolean>(false);
  public readonly tradesList$ = new BehaviorSubject<AllTradesItem[]>([]);
  private readonly filters$ = new BehaviorSubject<AllTradesFilters>({
    take: this.maxItemsInRequestWithPeriod,
    exchange: '',
    symbol: '',
    to: 0,
    from: 0,
    descending: true
  });

  private readonly allColumns: BaseColumnSettings<AllTradesItem>[] = [
    {
      id: 'qty',
      displayName: 'Кол-во',
      classFn: (data): string => data.side,
      sortChangeFn: this.getSortFn('qty'),
      filterData: {
        filterName: 'qty',
        intervalStartName: 'qtyFrom',
        intervalEndName: 'qtyTo',
        isInterval: true
      }
    },
    {
      id: 'price',
      displayName: 'Цена',
      sortChangeFn: this.getSortFn('price'),
      filterData: {
        filterName: 'price',
        intervalStartName: 'priceFrom',
        intervalEndName: 'priceTo',
        isInterval: true
      }
    },
    {
      id: 'timestamp',
      displayName: 'Время',
      transformFn: (data: AllTradesItem): string | null => {
        const timezone = this.timezoneConverter?.getTimezone();
        const timezoneName = !!timezone ? `UTC${timezone.utcOffset < 0 ? '+' : '-'}${timezone.formattedOffset}` : null;
        return this.datePipe.transform(
          data.timestamp,
          'HH:mm:ss',
          timezoneName ?? TimezoneConverter.moscowTimezone
        );
      }
    },
    {
      id: 'side',
      displayName: 'Сторона',
      classFn: (data): string => data.side,
      sortChangeFn: this.getSortFn('side'),
      filterData: {
        filterName: 'side',
        isDefaultFilter: true,
        filters: [
          { text: 'Продажа', value: 'sell' },
          { text: 'Покупка', value: 'buy' }
        ]
      }
    },
    {id: 'oi', displayName: 'Откр. интерес'},
    {id: 'existing', displayName: 'Новое событие', transformFn: (data: AllTradesItem): string => data.existing ? 'Да' : 'Нет'},
  ];
  private readonly fixedColumns: BaseColumnSettings<AllTradesItem>[] = [
    {
      id: 'side_indicator',
      displayName: '',
      width: 5,
      classFn: (data): string => `side-indicator bg-${data.side} ${data.side}`,
      transformFn: (): string => '.'
    }
  ];
  private timezoneConverter?: TimezoneConverter;
  private readonly NEW_TRADES_PERIOD = 50;

  tableConfig$!: Observable<TableConfig<AllTradesItem>>;

  constructor(
    private readonly allTradesService: AllTradesService,
    private readonly settingsService: WidgetSettingsService,
    private readonly translatorService: TranslatorService,
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<AllTradesSettings>(this.guid)
      .pipe(
        shareReplay(1)
      );

    this.initTrades();
    this.initTableConfig();

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.applyFilter({
        exchange: settings.exchange,
        symbol: settings.symbol,
        from: toUnixTimestampSeconds(startOfDay(new Date())),
        to: toUnixTimestampSeconds(new Date()),
        take: this.maxItemsInRequestWithPeriod
      });
    });
  }

  public scrolled(): void {
    this.tradesList$.pipe(
      take(1),
      withLatestFrom(this.isLoading$, this.filters$),
      filter(([, isLoading,]) => !isLoading),
      map(([tradesList, , currentFilters]) => ({ tradesList, currentFilters })),
    ).subscribe(s => {
      const loadedIndex = s.currentFilters.take! + s.currentFilters.offset!;
      if (s.tradesList.length < loadedIndex) {
        return;
      }

      this.updateFilters(curr => ({
        ...curr,
        offset: s.tradesList.length
      }));
    });
  }

  applyFilter(filters: any): void {
    this.updateFilters(curr => {
      const allFilters = {
        ...curr,
        ...filters
      } as { [filterKey: string]: string | string[] | null };

      const cleanedFilters: { [filterKey: string]: string | string[] | null } = Object.keys(allFilters)
        .filter(key => allFilters[key] != null && allFilters[key]!.length)
        .reduce((acc, curr) => {
          if (Array.isArray(allFilters[curr])) {
            acc[curr] = (allFilters[curr] as string[]).join(';');
          }
          else {
            acc[curr] = allFilters[curr];
          }
          return acc;
        }, {} as { [filterName: string]: string | string[] | null });

      return {
        ...cleanedFilters,
        descending: (cleanedFilters.orderBy as string) ? cleanedFilters.descending ?? false : true,
        to: toUnixTimestampSeconds(new Date()),
        offset: 0
      } as AllTradesFilters;
    });
  }

  public ngOnDestroy(): void {
    this.tradesList$.complete();
    this.isLoading$.complete();
    this.filters$.complete();
    this.contentSize$.complete();
  }

  containerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  private initTableConfig(): void {
    this.tableConfig$ = this.settings$.pipe(
      mapWith(
        () => this.translatorService.getTranslator('all-trades/all-trades'),
        (settings, translate) => ({ settings, translate })
      ),
      map(({ settings, translate }) => {
          const highlightRows = settings.highlightRowsBySide ?? false;

          return {
            columns: [
              ...this.fixedColumns,
              ...this.allColumns
                .filter(col => settings.allTradesColumns.includes(col.id))
                .map(col => ({
                    ...col,
                    displayName: translate(
                      ['columns', col.id, 'displayName'],
                      { fallback: col.displayName }
                    ),
                    filterData: col.filterData && {
                      ...col.filterData,
                      filters: col.filterData.filters?.map(f => ({
                        text: translate(
                          ['columns', col.id, 'filters', f.value],
                          { fallback: f.text }
                        ),
                        value: f.value as string
                      }))
                    }
                  })
                )
            ],
            rowConfig: {
              rowClass: (data): string | null => {
                if (!highlightRows) {
                  return null;
                }

                if (data.side === 'buy') {
                  return 'buy-row';
                }

                return 'sell-row';
              }
            }
          };

        }
      )
    );
  }

  private updateFilters(update: (curr: AllTradesFilters) => AllTradesFilters): void {
    this.filters$.pipe(
      take(1)
    ).subscribe(curr => {
      this.filters$.next(update(curr));
    });
  }

  private initTrades(): void {
    combineLatest([
      this.filters$,
      this.timezoneConverterService.getConverter()
    ])
    .pipe(
      tap(([, timezoneConverter]) => {
        this.timezoneConverter = timezoneConverter;
        this.isLoading$.next(true);
      }),
      map(([filters,]) => filters),
      mapWith(
        f => this.allTradesService.getTradesList(f),
        (filters, res) => ({ filters, res })
      ),
      withLatestFrom(this.tradesList$),
      map(([s, currentList]) => {
        if ((s.filters.offset ?? 0) > 0) {
          this.tradesList$.next([...currentList, ...s.res]);
        } else {
          this.tradesList$.next(s.res);
        }

        return s.filters;
      }),
      tap(() => this.isLoading$.next(false)),
      withLatestFrom(this.settings$),
      mapWith(
        ([, s]) => this.allTradesService.getNewTradesSubscription(s)
          .pipe(
            bufferTime(this.NEW_TRADES_PERIOD)
          ),
        ([filters], newTrades) => ({ filters, newTrades })
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ filters, newTrades }) => {
      this.filterNewTrades(filters, newTrades);
    });
  }

  private filterNewTrades(filters: AllTradesFilters, newTrades: AllTradesItem[]): void {
    const filteredNewTrades = newTrades.filter(trade =>
      (filters.qtyFrom == null || trade.qty > filters.qtyFrom) &&
      (filters.qtyTo == null || trade.qty < filters.qtyTo) &&
      (filters.priceFrom == null || trade.price > filters.priceFrom) &&
      (filters.priceTo == null || trade.price < filters.priceTo) &&
      (filters.side == null || trade.side === filters.side)
    );
    if (!filteredNewTrades.length) {
      return;
    }

    let tradesListCopy = JSON.parse(JSON.stringify(this.tradesList$.getValue())) as AllTradesItem[];

    tradesListCopy.unshift(...filteredNewTrades);
    tradesListCopy.sort((a, b) => {
      switch (filters.orderBy) {
        case 'side':
          if (a.side !== b.side) {
            if ((filters.descending ?? false)) {
              return a.side as Side === Side.Buy ? 1 : -1;
            }
            return a.side as Side === Side.Buy ? -1 : 1;
          }
          return 0;
        case 'price':
          return (filters.descending ?? false) ? b.price - a.price : a.price - b.price;
        case 'qty':
          return (filters.descending ?? false) ? b.qty - a.qty : a.qty - b.qty;
        default:
          return 0;
      }
    });

    tradesListCopy = tradesListCopy.slice(0, (filters.offset ?? 0) + (filters.limit ?? this.maxItemsInRequestWithPeriod));
    this.tradesList$.next(tradesListCopy);
  }

  private getSortFn(orderBy: string): (dir: string | null) => void {
    return (dir: string | null) => {
      this.updateFilters(curr => {
        const filter = {
          ...curr,
          to: toUnixTimestampSeconds(new Date()),
          offset: 0
        };

        delete filter.descending;
        delete filter.orderBy;

        if (dir != null && dir.length) {
          filter.descending = dir === 'descend';
          filter.orderBy = orderBy;
        } else {
          filter.descending = true;
        }

        return filter;
      });
    };
  }
}
