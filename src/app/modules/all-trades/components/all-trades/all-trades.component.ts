import { Component, DestroyRef, input, LOCALE_ID, OnDestroy, OnInit, inject } from '@angular/core';
import {AsyncPipe, DatePipe, formatNumber} from "@angular/common";
import {startOfDay, toUnixTimestampSeconds} from "../../../../shared/utils/datetime";
import {bufferTime, filter, map, tap} from "rxjs/operators";
import {BehaviorSubject, combineLatest, Observable, shareReplay, take, withLatestFrom} from "rxjs";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {AllTradesSettings} from '../../models/all-trades-settings.model';
import {
  AllTradesFilters,
  AllTradesItem,
  AllTradesPagination,
  AllTradesSort
} from '../../../../shared/models/all-trades.model';
import {AllTradesService} from '../../../../shared/services/all-trades.service';
import {BaseColumnSettings, FilterType, InputFieldType} from "../../../../shared/models/settings/table-settings.model";
import {TimezoneConverterService} from "../../../../shared/services/timezone-converter.service";
import {TimezoneConverter} from "../../../../shared/utils/timezone-converter";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {Side} from "../../../../shared/models/enums/side.model";
import {CdkDragDrop} from "@angular/cdk/drag-drop";
import {TableSettingHelper} from "../../../../shared/utils/table-setting.helper";
import {TableConfig} from "../../../../shared/models/table-config.model";
import {
  LazyLoadingBaseTableComponent
} from "../../../../shared/components/lazy-loading-base-table/lazy-loading-base-table.component";
import {toInstrumentKey} from "../../../../shared/utils/instruments";
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {
  InfiniteScrollTableComponent
} from '../../../../shared/components/infinite-scroll-table/infinite-scroll-table.component';

@Component({
  selector: 'ats-all-trades',
  templateUrl: './all-trades.component.html',
  styleUrls: ['./all-trades.component.less'],
  imports: [
    NzResizeObserverDirective,
    InfiniteScrollTableComponent,
    AsyncPipe
  ]
})
export class AllTradesComponent extends LazyLoadingBaseTableComponent<
  AllTradesItem,
  AllTradesFilters,
  AllTradesPagination
>
  implements OnInit, OnDestroy {
  private readonly allTradesService = inject(AllTradesService);
  protected readonly settingsService: WidgetSettingsService;
  private readonly translatorService = inject(TranslatorService);
  private readonly timezoneConverterService = inject(TimezoneConverterService);
  protected readonly destroyRef: DestroyRef;
  private readonly locale = inject(LOCALE_ID);

  readonly guid = input.required<string>();
  public readonly tradesList$ = new BehaviorSubject<AllTradesItem[]>([]);
  protected settingsTableName = 'allTradesTable';
  protected settingsColumnsName = 'allTradesColumns';
  private settings$!: Observable<AllTradesSettings>;
  private readonly datePipe = new DatePipe('ru-RU');
  private readonly fixedColumns: BaseColumnSettings<AllTradesItem>[] = [
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

  protected readonly allColumns: BaseColumnSettings<AllTradesItem>[] = [
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
      transformFn: (data: AllTradesItem): string => data.existing ? 'Да' : 'Нет'
    },
  ];

  private readonly NEW_TRADES_PERIOD = 50;

  constructor() {
    const settingsService = inject(WidgetSettingsService);
    const destroyRef = inject(DestroyRef);

    super(settingsService, destroyRef);

    this.settingsService = settingsService;
    this.destroyRef = destroyRef;
  }

  private get defaultPagination(): AllTradesPagination {
    return {
      from: toUnixTimestampSeconds(startOfDay(new Date())),
      to: toUnixTimestampSeconds(new Date()),
      take: this.loadingChunkSize
    };
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<AllTradesSettings>(this.guid())
      .pipe(
        shareReplay(1),
        takeUntilDestroyed(this.destroyRef)
      );

    super.ngOnInit();
  }

  public scrolled(): void {
    this.tradesList$.pipe(
      take(1),
      withLatestFrom(this.isLoading$),
      filter(([, isLoading,]) => !isLoading),
    )
      .subscribe(([tradesList]) => {
        const loadedIndex = this.pagination && (this.pagination.take + this.pagination.offset!);
        if (loadedIndex != null && tradesList.length < loadedIndex) {
          return;
        }

        this.pagination = {...(this.pagination ?? this.defaultPagination), offset: tradesList.length};
        this.scrolled$.next(null);
      });
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.tradesList$.complete();
  }

  changeColumnOrder(event: CdkDragDrop<any>): void {
    if (event.previousIndex < this.fixedColumns.length || event.currentIndex < this.fixedColumns.length) {
      return;
    }

    this.settings$.pipe(
      withLatestFrom(this.tableConfig$),
      take(1)
    ).subscribe(([settings, tableConfig]) => {
      const fixedColumnsIds = this.fixedColumns.map(c => c.id);
      this.settingsService.updateSettings<AllTradesSettings>(
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

  saveColumnWidth(event: { columnId: string, width: number }): void {
    super.saveColumnWidth<AllTradesSettings>(event, this.settings$);
  }

  protected initTableDataStream(): Observable<AllTradesItem[]> {
    combineLatest({
      settings: this.settings$.pipe(tap(() => this.filters$.next({}))),
      filters: this.filters$,
      sort: this.sort$.pipe(tap(() => this.pagination = null)),
      timezoneConverter: this.timezoneConverterService.getConverter(),
      isScrolled: this.scrolled$
    })
      .pipe(
        tap(x => {
          this.timezoneConverter = x.timezoneConverter;
          this.isLoading$.next(true);
        }),
        map(x => ({
            ...x,
            sort: x.sort ?? {descending: true},
            pagination: this.pagination ?? this.defaultPagination
          })
        ),
        mapWith(
          params => this.allTradesService.getTradesList(toInstrumentKey(params.settings), params.filters, params.pagination, params.sort),
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
        tap(() => this.isLoading$.next(false)),
        mapWith(
          params => this.allTradesService.getNewTradesSubscription(toInstrumentKey(params.settings))
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

  protected initTableConfigStream(): Observable<TableConfig<AllTradesItem>> {
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

  private filterNewTrades(filters: AllTradesFilters, sort: AllTradesSort, pagination: AllTradesPagination, newTrades: AllTradesItem[]): void {
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
