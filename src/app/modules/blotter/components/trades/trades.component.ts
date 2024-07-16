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
  take
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
import { mapWith } from "../../../../shared/utils/observable-helper";
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
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => a.symbol.localeCompare(b.symbol),
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
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => a.symbol.localeCompare(b.shortName),
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

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly service: BlotterService,
    private readonly timezoneConverterService: TimezoneConverterService,
    protected readonly translatorService: TranslatorService,
    protected readonly nzContextMenuService: NzContextMenuService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(
      settingsService,
      translatorService,
      nzContextMenuService,
      destroyRef
    );
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  protected initTableConfigStream(): Observable<TableConfig<DisplayTrade>> {
    return this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.tradesTable, current.tradesTable)
        && previous.badgeColor === current.badgeColor
      ),
      mapWith(
        () => this.translatorService.getTranslator('blotter/trades'),
        (s, t) => ({ s, t })
      ),
      takeUntilDestroyed(this.destroyRef),
      map(({ s, t }) => {
        const tableSettings = TableSettingHelper.toTableDisplaySettings(s.tradesTable, s.tradesColumns);

        return  {
          columns: this.allColumns
            .map(c => ({column: c, columnSettings: tableSettings?.columns.find(x => x.columnId === c.id)}))
            .filter(c => !!c.columnSettings)
            .map((column, index) => ({
              ...column.column,
              displayName: t(['columns', column.column.id, 'name'], { fallback: column.column.displayName }),
              tooltip: t(['columns', column.column.id, 'tooltip'], { fallback: column.column.tooltip }),
              filterData: column.column.filterData
                ? {
                  ...column.column.filterData,
                  filterName: t(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
                  filters: (column.column.filterData.filters ?? []).map(f => ({
                    value: f.value as unknown,
                    text: t(['columns', column.column.id, 'listOfFilter', f.value], {fallback: f.text})
                  }))
                }
                : undefined,
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
        row.symbol,
        row.exchange,
        row.board,
        s.badgeColor ?? defaultBadgeColor
      ));
  }

  protected rowToInstrumentKey(row: DisplayTrade): Observable<InstrumentKey | null> {
    return this.service.getInstrumentToSelect(row.symbol, row.exchange, row.board);
  }
}
