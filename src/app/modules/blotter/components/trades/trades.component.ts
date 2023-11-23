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
  of,
  switchMap
} from 'rxjs';
import {
  debounceTime,
  map,
  mergeMap,
  startWith
} from 'rxjs/operators';
import { BlotterService } from '../../services/blotter.service';
import { MathHelper } from '../../../../shared/utils/math-helper';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  isEqualPortfolioDependedSettings
} from "../../../../shared/utils/settings-helper";
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { ColumnsNames, TableNames } from '../../models/blotter-settings.model';
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BaseTableComponent } from "../base-table/base-table.component";
import {
  DisplayTrade,
  TradeFilter
} from '../../models/trade.model';

@Component({
  selector: 'ats-trades',
  templateUrl: './trades.component.html',
  styleUrls: ['./trades.component.less']
})
export class TradesComponent extends BaseTableComponent<DisplayTrade, TradeFilter> implements OnInit {
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  displayTrades$: Observable<DisplayTrade[]> = of([]);
  allColumns: BaseColumnSettings<DisplayTrade>[] = [
    {
      id: 'id',
      displayName: 'Id',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => Number(a.id) - Number(b.id),
      filterData: {
        filterName: 'id',
        isDefaultFilter: false
      },
      tooltip: 'Идентификационный номер сделки'
    },
    {
      id: 'orderno',
      displayName: 'Заявка',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => Number(a.orderno) - Number(b.orderno),
      filterData: {
        filterName: 'orderno',
        isDefaultFilter: false
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
        isDefaultFilter: false
      },
      tooltip: 'Биржевой идентификатор ценной бумаги',
      minWidth: 75
    },
    {
      id: 'side',
      displayName: 'Сторона',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade): number => a.side.toString().localeCompare(b.side.toString()),
      filterData: {
        filterName: 'side',
        isDefaultFilter: true,
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
    protected readonly destroyRef: DestroyRef
  ) {
    super(service, settingsService, translatorService, destroyRef);
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.tradesTable, current.tradesTable)
        && previous.badgeColor === current.badgeColor
      ),
      mapWith(
        () => this.translatorService.getTranslator('blotter/trades'),
        (s, t) => ({ s, t })
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ s, t }) => {
      const tableSettings = s.tradesTable ?? TableSettingHelper.toTableDisplaySettings(s.tradesColumns);

      if (tableSettings) {
        this.listOfColumns = this.allColumns
          .map(c => ({column: c, columnSettings: tableSettings.columns.find(x => x.columnId === c.id)}))
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
            width: column.columnSettings!.columnWidth ?? this.columnDefaultWidth,
            order: column.columnSettings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index)
          }))
          .sort((a, b) => a.order - b.order);

        this.tableInnerWidth = this.listOfColumns.reduce((prev, cur) =>prev + cur.width! , 0);
      }
    });

    const trades$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getTrades(settings)),
      debounceTime(100),
      startWith([])
    );

    this.displayTrades$ = combineLatest([
      trades$,
      this.timezoneConverterService.getConverter()
      ]
    ).pipe(
      map(([trades, converter]) => trades.map(t => <DisplayTrade>{
        ...t,
        volume: MathHelper.round(t.qtyUnits * t.price, 2),
        date: converter.toTerminalDate(t.date)
      })),
      mergeMap(trades => this.filter$.pipe(
        map(f => trades.filter(t => this.justifyFilter(t, f)))
      ))
    );
  }
}
