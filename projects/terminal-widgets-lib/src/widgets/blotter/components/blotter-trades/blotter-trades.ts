import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  combineLatest,
  defer,
  distinctUntilChanged,
  Observable,
  switchMap,
  take,
  tap
} from 'rxjs';
import {
  debounceTime,
  map,
  mergeMap,
  startWith
} from 'rxjs/operators';
import {BlotterService} from '../../services/blotter.service';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
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
import {DisplayTrade} from '@terminal-widgets-lib/widgets/blotter/types/trades.types';
import {
  BaseColumnSettings,
  FilterType,
  TableConfig
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {
  ColumnsNames,
  TableNames
} from '@terminal-widgets-lib/widgets/blotter/widget-settings.types';
import {TimezoneConverterService} from '@terminal-core-lib/features/timezones/services/timezone-converter.service';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {WidgetSettingsHelper} from '@terminal-core-lib/features/widget-settings/utils/widget-settings.helper';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {TableRowHeight} from '@terminal-core-lib/common/directives/table-row-height';
import {ResizeColumn} from '@terminal-core-lib/common/directives/resize-column';
import {TableSearchFilter} from '@terminal-core-lib/features/tables/components/table-search-filter/table-search-filter';
import {AddToWatchlistMenu} from '@terminal-core-lib/features/watchlist/components/add-to-watchlist-menu/add-to-watchlist-menu';
import {TradeFilter} from '@terminal-core-lib/features/client-info/services/trade-history-service.types';

@Component({
  selector: 'ats-blotter-trades',
  templateUrl: './blotter-trades.html',
  styleUrls: ['./blotter-trades.less'],
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
export class BlotterTrades extends BlotterBaseTable<DisplayTrade, TradeFilter> implements OnInit {
  readonly shouldShowSettingsChange = output<boolean>();

  allColumns: BaseColumnSettings<DisplayTrade>[] = [
    {
      id: 'id',
      displayName: 'Id',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => Number(a.id) - Number(b.id),
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
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => Number(a.orderNo) - Number(b.orderNo),
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
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => a.targetInstrument.symbol.localeCompare(b.targetInstrument.symbol),
      filterData: {
        filterName: 'symbol',
        filterType: FilterType.Search
      },
      tooltip: 'Биржевой идентификатор ценной бумаги',
      minWidth: 75
    },
    {
      id: 'shortName',
      displayName: 'Название',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => a.shortName.localeCompare(b.shortName),
      filterData: {
        filterName: 'shortName',
        filterType: FilterType.Search
      },
      tooltip: 'Наименование ценной бумаги',
      minWidth: 75
    },
    {
      id: 'side',
      displayName: 'Сторона',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => a.side.toString().localeCompare(b.side.toString()),
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
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => Number(a.qty) - Number(b.qty),
      tooltip: 'Количество сделок',
      minWidth: 65
    },
    {
      id: 'price',
      displayName: 'Цена',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => Number(a.price) - Number(b.price),
      tooltip: 'Цена'
    },
    {
      id: 'date',
      sourceField: 'displayDate',
      displayName: 'Время',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => Number(a.date) - Number(b.date),
      tooltip: 'Время совершения сделки',
      minWidth: 60
    },
    {
      id: 'volume',
      displayName: 'Объем',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => b.volume - a.volume,
      tooltip: 'Объём',
      minWidth: 60
    },
  ];

  override settingsTableName = TableNames.TradesTable;

  override settingsColumnsName = ColumnsNames.TradesColumns;

  override fileSuffix = 'trades';

  protected readonly service = inject(BlotterService);

  private readonly timezoneConverterService = inject(TimezoneConverterService);

  get restoreFiltersAndSortOnLoad(): boolean {
    return true;
  }

  override rowClick(row: DisplayTrade): void {
    this.settings$
      .pipe(
        take(1)
      )
      .subscribe(s => this.service.selectNewInstrument(
        row.targetInstrument.symbol,
        row.targetInstrument.exchange,
        row.targetInstrument.instrumentGroup ?? null,
        s.badgeColor ?? DefaultBadge
      ));
  }

  protected initTableConfigStream(): Observable<TableConfig<DisplayTrade>> {
    const tableSettings$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.tradesTable, current.tradesTable)
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
      translator: this.translatorService.getTranslator('blotter/trades'),
    }).pipe(
      mapWith(() => tableState$, (source, output) => ({...source, ...output})),
      takeUntilDestroyed(this.destroyRef),
      tap(x => {
        if (x.filters != null) {
          this.filterChange(x.filters);
        }
      }),
      map(x => {
        const tableSettings = TableSettingHelper.toTableDisplaySettings(x.tableSettings.tradesTable, x.tableSettings.tradesColumns);

        return {
          columns: this.allColumns
            .map(c => ({column: c, columnSettings: tableSettings?.columns.find(x => x.columnId === c.id)}))
            .filter(c => !!c.columnSettings)
            .map((column, index) => ({
              ...column.column,
              displayName: x.translator(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
              tooltip: x.translator(['columns', column.column.id, 'tooltip'], {fallback: column.column.tooltip}),
              filterData: column.column.filterData
                ? {
                  ...column.column.filterData,
                  filterName: x.translator(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
                  filters: (column.column.filterData.filters ?? []).map(f => ({
                    value: f.value as unknown,
                    text: x.translator(['columns', column.column.id, 'listOfFilter', f.value], {fallback: f.text}),
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

  protected initTableDataStream(): Observable<DisplayTrade[]> {
    const trades$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => WidgetSettingsHelper.isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getTrades(settings)),
      debounceTime(100),
      startWith([])
    );

    return combineLatest([
        trades$,
        this.timezoneConverterService.getConverter()
      ]
    ).pipe(
      map(([trades, converter]) => trades.map(t => <DisplayTrade>{
        ...t,
        displayDate: converter.toTerminalDate(t.date)
      })),
      mergeMap(trades => this.filters$.pipe(
        map(f => trades.filter(t => this.justifyFilter(t, f)))
      ))
    );
  }

  protected rowToInstrumentKey(row: DisplayTrade): Observable<InstrumentKey | null> {
    return this.service.getInstrumentToSelect(
      row.targetInstrument.symbol,
      row.targetInstrument.exchange,
      row.targetInstrument.instrumentGroup ?? null
    );
  }
}
