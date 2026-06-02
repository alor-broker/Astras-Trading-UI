import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  AsyncPipe,
  DatePipe,
  formatNumber
} from "@angular/common";
import {
  bufferTime,
  filter,
  map,
  tap
} from "rxjs/operators";
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  shareReplay,
  take,
  withLatestFrom
} from "rxjs";
import {CdkDragDrop} from "@angular/cdk/drag-drop";
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {InstrumentTradesService} from '@terminal-core-lib/features/instruments/services/instrument-trades.service';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {TimezoneConverterService} from '@terminal-core-lib/features/timezones/services/timezone-converter.service';
import {
  InstrumentTradesFilters,
  InstrumentTradesItem,
  InstrumentTradesPagination,
  InstrumentTradesSort
} from '@terminal-core-lib/features/instruments/services/instrument-trades-service.types';
import {LazyLoadingBaseTable} from "@terminal-core-lib/features/tables/components/lazy-loading-base-table/lazy-loading-base-table";
import {
  BaseColumnSettings,
  FilterType,
  InputFieldType,
  TableConfig
} from "@terminal-core-lib/features/tables/types/table-display-settings.types";
import {InstrumentTradesWidgetSettings} from '@terminal-widgets-lib/widgets/instrument-trades/widget-settings.types';
import {TimezoneConverter} from '@terminal-core-lib/features/timezones/utils/timezone-converter';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TableSettingHelper} from "@terminal-core-lib/features/tables/utils/table-settings.helper";
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {
  getUnixTime,
  startOfDay
} from 'date-fns';
import {InfiniteScrollTable} from '@terminal-core-lib/features/tables/components/infinite-scroll-table/infinite-scroll-table';

@Component({
  selector: 'ats-instrument-trades',
  templateUrl: './instrument-trades.html',
  styleUrls: ['./instrument-trades.less'],
  imports: [
    NzResizeObserverDirective,
    AsyncPipe,
    InfiniteScrollTable
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InstrumentTrades extends LazyLoadingBaseTable<
  InstrumentTradesItem,
  InstrumentTradesFilters,
  InstrumentTradesPagination
>
  implements OnInit, OnDestroy {
  readonly guid = input.required<string>();

  public readonly tradesList$ = new BehaviorSubject<InstrumentTradesItem[]>([]);

  protected override settingsTableName = 'allTradesTable';

  protected override settingsColumnsName = 'allTradesColumns';

  private readonly allTradesService = inject(InstrumentTradesService);

  private readonly translatorService = inject(TranslatorService);

  private readonly timezoneConverterService = inject(TimezoneConverterService);

  private readonly locale = inject(LOCALE_ID);

  private settings$!: Observable<InstrumentTradesWidgetSettings>;

  private readonly datePipe = new DatePipe('ru-RU');

  private readonly fixedColumns: BaseColumnSettings<InstrumentTradesItem>[] = [
    {
      id: 'side_indicator',
      displayName: '',
      width: 5,
      classFn: (data): string => `side-indicator bg-${data.side} ${data.side}`,
      transformFn: (): string => '.',
      isResizable: false,
      order: -1
    }
  ];

  private timezoneConverter?: TimezoneConverter;

  protected readonly allColumns: BaseColumnSettings<InstrumentTradesItem>[] = [
    {
      id: 'qty',
      displayName: 'Кол-во',
      minWidth: 70,
      classFn: (data): string => data.side,
      sortChangeFn: (dir): void => this.sort$.next(dir == null
        ? null
        : {
          descending: dir === 'descend',
          orderBy: 'qty'
        }),
      filterData: {
        filterName: 'qty',
        intervalStartName: 'qtyFrom',
        intervalEndName: 'qtyTo',
        filterType: FilterType.Interval,
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'price',
      displayName: 'Цена',
      minWidth: 70,
      sortChangeFn: (dir): void => this.sort$.next(dir == null
        ? null
        : {
          descending: dir === 'descend',
          orderBy: 'price'
        }),
      transformFn: data => formatNumber(data.price, this.locale, '0.0-10'),
      filterData: {
        filterName: 'price',
        intervalStartName: 'priceFrom',
        intervalEndName: 'priceTo',
        filterType: FilterType.Interval,
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'timestamp',
      displayName: 'Время',
      minWidth: 70,
      transformFn: (data: InstrumentTradesItem): string | null => {
        const timezone = this.timezoneConverter?.getTimezone();
        const timezoneName = timezone ? `UTC${timezone.utcOffset < 0 ? '+' : '-'}${timezone.formattedOffset}` : null;
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
      minWidth: 90,
      classFn: (data): string => data.side,
      sortChangeFn: (dir): void => this.sort$.next(dir == null
        ? null
        : {
          descending: dir === 'descend',
          orderBy: 'side'
        }),
      filterData: {
        filterName: 'side',
        filterType: FilterType.Default,
        filters: [
          {text: 'Продажа', value: 'sell'},
          {text: 'Покупка', value: 'buy'}
        ]
      }
    },
    {
      id: 'oi',
      displayName: 'Откр. интерес', minWidth: 60,
      transformFn: data => formatNumber(data.oi, this.locale, '0.0-10'),
    },
    {
      id: 'existing',
      displayName: 'Новое событие',
      minWidth: 60,
      transformFn: (data: InstrumentTradesItem): string => data.existing ? 'Да' : 'Нет'
    },
  ];

  private readonly NEW_TRADES_PERIOD = 50;

  private get defaultPagination(): InstrumentTradesPagination {
    return {
      from: getUnixTime(startOfDay(new Date())),
      to: getUnixTime(new Date()),
      take: this.loadingChunkSize
    };
  }

  override ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<InstrumentTradesWidgetSettings>(this.guid())
      .pipe(
        shareReplay(1),
        takeUntilDestroyed(this.destroyRef)
      );

    super.ngOnInit();
  }

  public onScrolled(): void {
    this.tradesList$.pipe(
      take(1),
      filter(() => !this.isLoading()),
    )
      .subscribe((tradesList) => {
        const loadedIndex = this.pagination && (this.pagination.take + this.pagination.offset!);
        if (loadedIndex != null && tradesList.length < loadedIndex) {
          return;
        }

        this.pagination = {...(this.pagination ?? this.defaultPagination), offset: tradesList.length};
        this.scrolled.set(new Date().getTime());
      });
  }

  public override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.tradesList$.complete();
  }

  override changeColumnOrder(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex < this.fixedColumns.length || event.currentIndex < this.fixedColumns.length) {
      return;
    }

    this.settings$.pipe(
      withLatestFrom(this.tableConfig$),
      take(1)
    ).subscribe(([settings, tableConfig]) => {
      const fixedColumnsIds = this.fixedColumns.map(c => c.id);
      this.settingsService.updateSettings<InstrumentTradesWidgetSettings>(
        settings.guid,
        {
          allTradesTable: TableSettingHelper.changeColumnOrder(
            {
              ...event,
              previousIndex: event.previousIndex - this.fixedColumns.length,
              currentIndex: event.currentIndex - this.fixedColumns.length
            },
            TableSettingHelper.toTableDisplaySettings(settings.allTradesTable, settings.allTradesColumns)!,
            tableConfig.columns.filter(c => !fixedColumnsIds.includes(c.id))
          )
        }
      );
    });
  }

  override saveColumnWidth(event: { columnId: string, width: number }): void {
    super.saveColumnWidth<InstrumentTradesWidgetSettings>(event, this.settings$);
  }

  protected initTableDataStream(): Observable<InstrumentTradesItem[]> {
    combineLatest({
      settings: this.settings$.pipe(tap(() => this.filters$.next({}))),
      filters: this.filters$,
      sort: this.sort$.pipe(tap(() => this.pagination = null)),
      timezoneConverter: this.timezoneConverterService.getConverter(),
      isScrolled: this.scrolledChanges$
    })
      .pipe(
        tap(x => {
          this.timezoneConverter = x.timezoneConverter;
          this.isLoading.set(true);
        }),
        map(x => ({
            ...x,
            sort: x.sort ?? {descending: true},
            pagination: this.pagination ?? this.defaultPagination
          })
        ),
        mapWith(
          params => this.allTradesService.getTradesList(InstrumentKeyHelper.toInstrumentKey(params.settings), params.filters, params.pagination, params.sort),
          (params, items) => ({params, items})
        ),
        withLatestFrom(this.tradesList$),
        map(([s, currentList]) => {
          if (this.pagination != null && (this.pagination.offset ?? 0) > 0) {
            this.tradesList$.next([...currentList, ...s.items]);
          } else {
            this.tradesList$.next(s.items);
          }

          return s.params;
        }),
        tap(() => this.isLoading.set(false)),
        mapWith(
          params => this.allTradesService.getNewTradesSubscription(InstrumentKeyHelper.toInstrumentKey(params.settings))
            .pipe(
              bufferTime(this.NEW_TRADES_PERIOD)
            ),
          (params, newTrades) => ({params, newTrades})
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({params, newTrades}) => {
        this.filterNewTrades(params.filters, params.sort, params.pagination, newTrades);
      });

    return this.tradesList$;
  }

  protected initTableConfigStream(): Observable<TableConfig<InstrumentTradesItem>> {
    return this.settings$.pipe(
      mapWith(
        () => this.translatorService.getTranslator('all-trades/all-trades'),
        (settings, translate) => ({settings, translate})
      ),
      map(({settings, translate}) => {
          const highlightRows = settings.highlightRowsBySide ?? false;
          const tableSettings = TableSettingHelper.toTableDisplaySettings(settings.allTradesTable, settings.allTradesColumns);

          return {
            columns: [
              ...this.fixedColumns,
              ...this.allColumns
                .map(column => ({column, settings: tableSettings?.columns.find(c => c.columnId === column.id)}))
                .filter(col => col.settings != null)
                .map((col, index) => ({
                    ...col.column,
                    displayName: translate(
                      ['columns', col.column.id, 'displayName'],
                      {fallback: col.column.displayName}
                    ),
                    tooltip: translate(
                      ['columns', col.column.id, 'tooltip'],
                      {fallback: col.column.displayName}
                    ),
                    filterData: col.column.filterData && {
                      ...col.column.filterData,
                      filters: col.column.filterData.filters?.map(f => ({
                        text: translate(
                          ['columns', col.column.id, 'filters', f.value],
                          {fallback: f.text}
                        ),
                        value: f.value as string
                      }))
                    },
                    width: col.settings!.columnWidth ?? this.defaultColumnWidth,
                    order: col.settings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index)
                  })
                )
                .sort((a, b) => a.order - b.order)
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

  private filterNewTrades(
    filters: InstrumentTradesFilters,
    sort: InstrumentTradesSort,
    pagination: InstrumentTradesPagination,
    newTrades: InstrumentTradesItem[]): void {
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

    let tradesListCopy = JSON.parse(JSON.stringify(this.tradesList$.getValue())) as InstrumentTradesItem[];

    tradesListCopy.unshift(...filteredNewTrades);
    tradesListCopy.sort((a, b) => {
      switch (sort.orderBy) {
        case 'side':
          if (a.side !== b.side) {
            if ((sort.descending ?? false)) {
              return a.side as Side === Side.Buy ? 1 : -1;
            }
            return a.side as Side === Side.Buy ? -1 : 1;
          }
          return 0;
        case 'price':
          return (sort.descending ?? false) ? b.price - a.price : a.price - b.price;
        case 'qty':
          return (sort.descending ?? false) ? b.qty - a.qty : a.qty - b.qty;
        default:
          return 0;
      }
    });

    tradesListCopy = tradesListCopy.slice(0, (pagination.offset ?? 0) + (pagination.limit ?? this.loadingChunkSize));
    this.tradesList$.next(tradesListCopy);
  }
}
