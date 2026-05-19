import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  combineLatest,
  defer,
  distinctUntilChanged,
  Observable,
  switchMap,
  take
} from "rxjs";
import {
  debounceTime,
  map,
  mergeMap,
  startWith,
  tap
} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {ExportHelper} from "../../utils/export-helper";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {LetDirective} from '@ngrx/component';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {NzTableModule} from 'ng-zorro-antd/table';
import {
  CdkDrag,
  CdkDropList
} from '@angular/cdk/drag-drop';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {DecimalPipe} from '@angular/common';
import {BlotterBaseTable} from '@terminal-widgets-lib/widgets/blotter/components/blotter-base-table/blotter-base-table';
import {RepoTrade} from '@terminal-core-lib/features/portfolios/types/trade.types';
import {TradeFilter} from '@terminal-core-lib/features/client-info/services/trade-history-service.types';
import {
  BaseColumnSettings,
  FilterType,
  TableConfig
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {
  allRepoTradesColumns,
  TableNames
} from '@terminal-widgets-lib/widgets/blotter/widget-settings.types';
import {TimezoneConverterService} from '@terminal-core-lib/features/timezones/services/timezone-converter.service';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {WidgetSettingsHelper} from '@terminal-core-lib/features/widget-settings/utils/widget-settings.helper';
import {BlotterService} from '@terminal-widgets-lib/widgets/blotter/services/blotter.service';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {TableRowHeight} from '@terminal-core-lib/common/directives/table-row-height';
import {ResizeColumn} from '@terminal-core-lib/common/directives/resize-column';
import {TableSearchFilter} from '@terminal-core-lib/features/tables/components/table-search-filter/table-search-filter';
import {AddToWatchlistMenu} from '@terminal-core-lib/features/watchlist/components/add-to-watchlist-menu/add-to-watchlist-menu';

@Component({
  selector: 'ats-blotter-repo-trades',
  templateUrl: './blotter-repo-trades.html',
  styleUrls: ['./blotter-repo-trades.less'],
  imports: [
    TranslocoDirective,
    NzEmptyComponent,
    LetDirective,
    NzResizeObserverDirective,
    CdkDropList,
    CdkDrag,
    NzTooltipDirective,
    NzIconDirective,
    NzButtonComponent,
    NzDropdownMenuComponent,
    DecimalPipe,
    NzTableModule,
    TableRowHeight,
    ResizeColumn,
    TableSearchFilter,
    AddToWatchlistMenu
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BlotterRepoTrades extends BlotterBaseTable<RepoTrade, TradeFilter> {
  readonly shouldShowSettingsChange = output<boolean>();

  allColumns: BaseColumnSettings<RepoTrade>[] = [
    {
      id: 'id',
      displayName: 'Id',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(a.id) - Number(b.id),
      filterData: {
        filterName: 'id',
        filterType: FilterType.Search
      },
      tooltip: 'Идентификационный номер сделки'
    },
    {
      id: 'orderNo',
      displayName: 'Заявка',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(a.orderNo) - Number(b.orderNo),
      filterData: {
        filterName: 'orderNo',
        filterType: FilterType.Search
      },
      tooltip: 'Номер заявки',
      minWidth: 80
    },
    {
      id: 'symbol',
      displayName: 'Тикер',
      sortOrder: null,
      transformFn: data => data.targetInstrument.symbol,
      sortFn: (a: RepoTrade, b: RepoTrade): number => a.targetInstrument.symbol.localeCompare(b.targetInstrument.symbol),
      filterData: {
        filterName: 'symbol',
        filterType: FilterType.Search
      },
      tooltip: 'Биржевой идентификатор ценной бумаги',
      minWidth: 75
    },
    {
      id: 'side',
      displayName: 'Сторона',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => a.side.toString().localeCompare(b.side.toString()),
      filterData: {
        filterName: 'side',
        filterType: FilterType.DefaultMultiple,
        filters: [
          {text: 'Покупка', value: 'buy'},
          {text: 'Продажа', value: 'sell'}
        ]
      },
      tooltip: 'Сторона сделки (покупка/продажа)',
      minWidth: 75
    },
    {
      id: 'qty',
      displayName: 'Кол-во',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(a.qty) - Number(b.qty),
      tooltip: 'Количество сделок',
      minWidth: 65
    },
    {
      id: 'price',
      displayName: 'Цена',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(a.price) - Number(b.price),
      tooltip: 'Цена'
    },
    {
      id: 'date',
      displayName: 'Время',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(a.date) - Number(b.date),
      tooltip: 'Время совершения сделки',
      minWidth: 60
    },
    {
      id: 'value',
      displayName: 'Объем',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(b.repoSpecificFields.value) - Number(a.repoSpecificFields.value),
      filterData: {
        filterName: 'repoSpecificFields.value',
        filterType: FilterType.Search
      },
      tooltip: 'Объём',
      minWidth: 60
    },
    {
      id: 'repoRate',
      displayName: '% годовых',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(b.repoSpecificFields.repoRate) - Number(a.repoSpecificFields.repoRate),
      filterData: {
        filterName: 'repoSpecificFields.repoRate',
        filterType: FilterType.Search
      },
      tooltip: '% годовых',
      minWidth: 60
    },
    {
      id: 'extRef',
      displayName: 'Пользователь внеш. системы',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => a.repoSpecificFields.extRef.toString().localeCompare(b.repoSpecificFields.extRef.toString()),
      filterData: {
        filterName: 'repoSpecificFields.extRef',
        filterType: FilterType.Search
      },
      tooltip: 'Пользователь внеш. системы',
      minWidth: 60
    },
    {
      id: 'repoTerm',
      displayName: 'Срок',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(b.repoSpecificFields.repoTerm) - Number(a.repoSpecificFields.repoTerm),
      filterData: {
        filterName: 'repoSpecificFields.repoTerm',
        filterType: FilterType.Search
      },
      tooltip: 'Срок РЕПО',
      minWidth: 50
    },
    {
      id: 'account',
      displayName: 'Торговый счёт',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => a.repoSpecificFields.account.toString().localeCompare(b.repoSpecificFields.account.toString()),
      filterData: {
        filterName: 'repoSpecificFields.account',
        filterType: FilterType.Search
      },
      tooltip: 'Торговый счёт',
      minWidth: 60
    },
    {
      id: 'tradeTypeInfo',
      displayName: 'Тип',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => a.repoSpecificFields.tradeTypeInfo.toString().localeCompare(b.repoSpecificFields.tradeTypeInfo.toString()),
      filterData: {
        filterName: 'repoSpecificFields.tradeTypeInfo',
        filterType: FilterType.Search
      },
      tooltip: 'Тип',
      minWidth: 60
    },
    {
      id: 'yield',
      displayName: 'Доход',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(b.repoSpecificFields.yield) - Number(a.repoSpecificFields.yield),
      filterData: {
        filterName: 'repoSpecificFields.yield',
        filterType: FilterType.Search
      },
      tooltip: 'Доход',
      minWidth: 50
    },
  ];

  override settingsTableName = TableNames.RepoTradesTable;

  override fileSuffix = 'repoTrades';

  private readonly service = inject(BlotterService);

  private readonly timezoneConverterService = inject(TimezoneConverterService);

  get restoreFiltersAndSortOnLoad(): boolean {
    return true;
  }

  override searchInItem(trade: RepoTrade, key: keyof RepoTrade | keyof RepoTrade['repoSpecificFields'], value?: string): boolean {
    if (value == null || !value.length) {
      return true;
    }

    return ((trade[key as keyof RepoTrade] as unknown) ?? trade.repoSpecificFields[<keyof RepoTrade['repoSpecificFields']>key])!.toString().toLowerCase().includes((value as string).toLowerCase());
  }

  protected initTableConfigStream(): Observable<TableConfig<RepoTrade>> {
    const tableSettings$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.repoTradesTable, current.repoTradesTable)
        && previous.badgeColor === current.badgeColor
      )
    );

    const tableState$ = defer(() => {
      return combineLatest({
        filters: this.getFiltersState().pipe(take(1)),
        sort: this.getSortState().pipe(take(1))
      });
    });

    return combineLatest({
      tableSettings: tableSettings$,
      tTrades: this.translatorService.getTranslator('blotter/trades'),
      tRepoTrades: this.translatorService.getTranslator('blotter/repo-trades')
    }).pipe(
      mapWith(() => tableState$, (source, output) => ({...source, ...output})),
      takeUntilDestroyed(this.destroyRef),
      tap(x => {
        if (x.filters != null) {
          this.filterChange(x.filters);
        }
      }),
      map(x => {
        const tableSettings = TableSettingHelper.toTableDisplaySettings(x.tableSettings.repoTradesTable, allRepoTradesColumns.filter(c => c.isDefault).map(c => c.id));

        return {
          columns: this.allColumns
            .map(c => ({column: c, columnSettings: tableSettings?.columns.find(x => x.columnId === c.id)}))
            .filter(c => !!c.columnSettings)
            .map((column, index) => ({
              ...column.column,
              displayName: x.tTrades(
                ['columns', column.column.id, 'name'],
                {
                  fallback: x.tRepoTrades(['columns', column.column.id, 'name'], {falback: column.column.displayName})
                }
              ),
              tooltip: x.tTrades(
                ['columns', column.column.id, 'tooltip'],
                {
                  fallback: x.tRepoTrades(['columns', column.column.id, 'tooltip'], {falback: column.column.tooltip})
                }
              ),
              filterData: column.column.filterData
                ? {
                  ...column.column.filterData,
                  filterName: x.tTrades(
                    ['columns', column.column.id, 'name'],
                    {
                      fallback: x.tRepoTrades(['columns', column.column.id, 'name'], {falback: column.column.displayName})
                    }
                  ),
                  filters: (column.column.filterData.filters ?? []).map(f => ({
                    value: f.value as unknown,
                    text: x.tTrades(['columns', column.column.id, 'listOfFilter', f.value], {fallback: f.text}),
                    byDefault: this.isFilterItemApplied(column.column.id, x.filters, f)
                  })),
                  initialValue: x.filters?.[column.column.id]
                }
                : undefined,
              sortOrder: this.getSort(column.column.id, x.sort),
              width: column.columnSettings!.columnWidth ?? this.defaultColumnWidth,
              order: column.columnSettings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index)
            }))
            .sort((a, b) => a.order - b.order)
        };
      })
    );
  }

  protected initTableDataStream(): Observable<RepoTrade[]> {
    const trades$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => WidgetSettingsHelper.isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getRepoTrades(settings)),
      debounceTime(100),
      startWith([])
    );

    return combineLatest([
        trades$,
        this.timezoneConverterService.getConverter()
      ]
    ).pipe(
      map(([trades, converter]) => trades.map((t: RepoTrade) => <RepoTrade>{
        ...t,
        date: converter.toTerminalDate(t.date)
      })),
      mergeMap(trades => this.filters$.pipe(
        map(f => trades.filter((t: RepoTrade) => this.justifyFilter(t, f)))
      ))
    );
  }

  protected rowToInstrumentKey(row: RepoTrade): Observable<InstrumentKey | null> {
    return this.service.getInstrumentToSelect(
      row.targetInstrument.symbol,
      row.targetInstrument.exchange,
      row.targetInstrument.instrumentGroup ?? null
    );
  }

  protected override exportToFile(data?: RepoTrade[]): void {
    combineLatest({
      tBlotter: this.translatorService.getTranslator('blotter'),
      settings: this.settings$,
      tableConfig: this.tableConfig$
    })
      .pipe(
        take(1),
      )
      .subscribe(({tBlotter, settings, tableConfig}) => {
        const valueTranslators = new Map<string, (value: any) => string>([
          ['date', (value): string => this.formatDate(value)]
        ]);

        const exportedData = (data ?? []).map(trade => ({...trade, ...trade.repoSpecificFields}));

        ExportHelper.exportToCsv(
          tBlotter(['repoTradesTab']),
          settings,
          [...exportedData],
          tableConfig.columns,
          valueTranslators
        );
      });
  }
}
