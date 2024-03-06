import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DatePipe } from "@angular/common";
import { startOfDay, toUnixTimestampSeconds } from "../../../../shared/utils/datetime";
import { filter, map, tap, bufferTime } from "rxjs/operators";
import {
  BehaviorSubject,
  combineLatest,
  take,
  withLatestFrom
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { AllTradesSettings } from '../../models/all-trades-settings.model';
import {
  AllTradesFilters,
  AllTradesItem,
  AllTradesPagination,
  AllTradesReqFilters
} from '../../../../shared/models/all-trades.model';
import { AllTradesService } from '../../../../shared/services/all-trades.service';
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TimezoneConverter } from "../../../../shared/utils/timezone-converter";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Side } from "../../../../shared/models/enums/side.model";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { BaseTableComponent } from "../../../../shared/components/base-table/base-table.component";

@Component({
  selector: 'ats-all-trades',
  templateUrl: './all-trades.component.html',
  styleUrls: ['./all-trades.component.less'],
})
export class AllTradesComponent extends BaseTableComponent<
    AllTradesSettings,
    AllTradesItem,
    AllTradesFilters,
    AllTradesPagination
  >
implements OnInit, OnDestroy {
  private readonly datePipe = new DatePipe('ru-RU');

  public readonly tradesList$ = new BehaviorSubject<AllTradesItem[]>([]);

  protected readonly allColumns: BaseColumnSettings<AllTradesItem>[] = [
    {
      id: 'qty',
      displayName: 'Кол-во',
      classFn: (data): string => data.side,
      sortChangeFn: (dir): void => this.sort$.next(dir == null ? null : { descending: dir === 'descend', orderBy: 'qty' }),
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
      sortChangeFn: (dir): void => this.sort$.next(dir == null ? null : { descending: dir === 'descend', orderBy: 'price' }),
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
      sortChangeFn: (dir): void => this.sort$.next(dir == null ? null : { descending: dir === 'descend', orderBy: 'side' }),
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
      transformFn: (): string => '.',
      isResizable: false,
      order: -1
    }
  ];
  private timezoneConverter?: TimezoneConverter;
  private readonly NEW_TRADES_PERIOD = 50;

  protected settingsTableName = 'allTradesTable';
  protected settingsColumnsName = 'allTradesColumns';

  private get defaultPagination(): AllTradesPagination {
    return  {
      from: toUnixTimestampSeconds(startOfDay(new Date())),
      to: toUnixTimestampSeconds(new Date()),
      take: this.loadingChunkSize
    };
  }

  constructor(
    private readonly allTradesService: AllTradesService,
    protected readonly settingsService: WidgetSettingsService,
    private readonly translatorService: TranslatorService,
    private readonly timezoneConverterService: TimezoneConverterService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(settingsService, destroyRef);
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.applyFilter({
        exchange: settings.exchange,
        symbol: settings.symbol
      });
    });
  }

  protected initTableData(): void {
    combineLatest([
      this.filters$,
      this.sort$
        .pipe(tap(() => this.pagination = null)),
      this.timezoneConverterService.getConverter(),
      this.scrolled$
    ])
      .pipe(
        tap(([,, timezoneConverter]) => {
          this.timezoneConverter = timezoneConverter;
          this.isLoading$.next(true);
        }),
        map(([filters, sort]) => ({
          ...filters,
          ...(sort == null ? { descending: true } : sort),
          ...(this.pagination == null ? this.defaultPagination : this.pagination)
        } as AllTradesReqFilters)),
        mapWith(
          (f: AllTradesReqFilters) => this.allTradesService.getTradesList(f),
          (filters, res) => ({ filters, res })
        ),
        withLatestFrom(this.tradesList$),
        map(([s, currentList]) => {
          if (this.pagination != null && (this.pagination.offset ?? 0) > 0) {
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
      )
      .subscribe(({filters, newTrades}) => {
        this.filterNewTrades(filters, newTrades);
      });
  }

  protected initTableConfig(): void {
    this.tableConfig$ = this.settings$.pipe(
      mapWith(
        () => this.translatorService.getTranslator('all-trades/all-trades'),
        (settings, translate) => ({ settings, translate })
      ),
      map(({ settings, translate }) => {
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

  private filterNewTrades(filters: AllTradesReqFilters, newTrades: AllTradesItem[]): void {
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

    tradesListCopy = tradesListCopy.slice(0, (filters.offset ?? 0) + (filters.limit ?? this.loadingChunkSize));
    this.tradesList$.next(tradesListCopy);
  }
}
