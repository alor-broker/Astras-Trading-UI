import {
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output
} from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  Observable,
  switchMap,
  take, tap
} from 'rxjs';
import {
  debounceTime,
  map,
  mergeMap,
  startWith
} from 'rxjs/operators';
import { BlotterService } from '../../services/blotter.service';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  isEqualPortfolioDependedSettings
} from "../../../../shared/utils/settings-helper";
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { ColumnsNames, TableNames } from '../../models/blotter-settings.model';
import { BaseColumnSettings, FilterType } from "../../../../shared/models/settings/table-settings.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BlotterBaseTableComponent } from "../blotter-base-table/blotter-base-table.component";
import {
  DisplayTrade,
  TradeFilter
} from '../../models/trade.model';
import { TableConfig } from "../../../../shared/models/table-config.model";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { NzContextMenuService } from "ng-zorro-antd/dropdown";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";

@Component({
  selector: 'ats-trades',
  templateUrl: './trades.component.html',
  styleUrls: ['./trades.component.less']
})
export class TradesComponent extends BlotterBaseTableComponent<DisplayTrade, TradeFilter> implements OnInit {
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

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
          { text: 'Покупка', value: 'buy' },
          { text: 'Продажа', value: 'sell' }
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

  settingsTableName = TableNames.TradesTable;
  settingsColumnsName = ColumnsNames.TradesColumns;
  fileSuffix = 'trades';

  get restoreFiltersAndSortOnLoad(): boolean {
    return true;
  }

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly service: BlotterService,
    private readonly timezoneConverterService: TimezoneConverterService,
    protected readonly translatorService: TranslatorService,
    protected readonly nzContextMenuService: NzContextMenuService,
    protected readonly widgetLocalStateService: WidgetLocalStateService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(
      settingsService,
      translatorService,
      nzContextMenuService,
      widgetLocalStateService,
      destroyRef
    );
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  protected initTableConfigStream(): Observable<TableConfig<DisplayTrade>> {
    const tableSettings$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.tradesTable, current.tradesTable)
        && previous.badgeColor === current.badgeColor
      )
    );

    return combineLatest({
      tableSettings: tableSettings$,
      filters: this.getFiltersState().pipe(take(1)),
      sort: this.getSortState().pipe(take(1)),
      translator: this.translatorService.getTranslator('blotter/trades'),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(x => {
        if(x.filters != null) {
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
              displayName: x.translator(['columns', column.column.id, 'name'], { fallback: column.column.displayName }),
              tooltip: x.translator(['columns', column.column.id, 'tooltip'], { fallback: column.column.tooltip }),
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
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
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
        date: converter.toTerminalDate(t.date)
      })),
      mergeMap(trades => this.filters$.pipe(
        map(f => trades.filter(t => this.justifyFilter(t, f)))
      ))
    );
  }

  rowClick(row: DisplayTrade): void {
    this.settings$
      .pipe(
        take(1)
      )
      .subscribe(s => this.service.selectNewInstrument(
        row.targetInstrument.symbol,
        row.targetInstrument.exchange,
        row.targetInstrument.instrumentGroup ?? null,
        s.badgeColor ?? defaultBadgeColor
      ));
  }

  protected rowToInstrumentKey(row: DisplayTrade): Observable<InstrumentKey | null> {
    return this.service.getInstrumentToSelect(
      row.targetInstrument.symbol,
      row.targetInstrument.exchange,
      row.targetInstrument.instrumentGroup ?? null
    );
  }
}
