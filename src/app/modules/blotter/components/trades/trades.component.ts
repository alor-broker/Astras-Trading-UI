import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil
} from 'rxjs';
import {
  debounceTime,
  map,
  mergeMap,
  startWith
} from 'rxjs/operators';
import { Trade } from 'src/app/shared/models/trades/trade.model';
import { Column } from '../../models/column.model';
import { TradeFilter } from '../../models/trade-filter.model';
import { BlotterService } from '../../services/blotter.service';
import { MathHelper } from '../../../../shared/utils/math-helper';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../../../shared/models/settings/blotter-settings.model";
import { NzTableComponent } from 'ng-zorro-antd/table';
import { ExportHelper } from "../../utils/export-helper";
import {
  isEqualPortfolioDependedSettings
} from "../../../../shared/utils/settings-helper";
import { TableAutoHeightBehavior } from '../../utils/table-auto-height.behavior';
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';

interface DisplayTrade extends Trade {
  volume: number;
}

@Component({
  selector: 'ats-trades[guid]',
  templateUrl: './trades.component.html',
  styleUrls: ['./trades.component.less']
})
export class TradesComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly columnDefaultWidth = 100;

  @ViewChild('nzTable')
  table?: NzTableComponent<DisplayTrade>;
  @ViewChild('tableContainer')
  tableContainer?: ElementRef<HTMLElement>;

  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  tableInnerWidth: number = 1000;
  displayTrades$: Observable<DisplayTrade[]> = of([]);
  filter = new BehaviorSubject<TradeFilter>({});
  isFilterDisabled = () => Object.keys(this.filter.getValue()).length === 0;
  allColumns: Column<DisplayTrade, TradeFilter>[] = [
    {
      id: 'id',
      name: 'Id',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade) => Number(a.id) - Number(b.id),
      searchDescription: 'Поиск по Номеру',
      searchFn: (trade, filter) => filter.id ? trade.id.toLowerCase().includes(filter.id.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Идентификационный номер сделки'
    },
    {
      id: 'orderno',
      name: 'Заявка',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade) => Number(a.orderno) - Number(b.orderno),
      searchDescription: 'Поиск по заявке',
      searchFn: (trade, filter) => filter.orderno ? trade.orderno.toLowerCase().includes(filter.orderno.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Номер заявки'
    },
    {
      id: 'symbol',
      name: 'Тикер',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade) => a.symbol.localeCompare(b.symbol),
      searchDescription: 'Поиск по Тикеру',
      searchFn: (trade, filter) => filter.symbol ? trade.symbol.toLowerCase().includes(filter.symbol.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Биржевой идентификатор ценной бумаги'
    },
    {
      id: 'side',
      name: 'Сторона',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade) => a.side.toString().localeCompare(b.side.toString()),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      listOfFilter: [
        {text: 'Покупка', value: 'buy'},
        {text: 'Продажа', value: 'sell'}
      ],
      isFilterVisible: false,
      hasFilter: true,
      tooltip: 'Сторона сделки (покупка/продажа)'
    },
    {
      id: 'qty',
      name: 'Кол-во',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade) => Number(a.qty) - Number(b.qty),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Количество сделок'
    },
    {
      id: 'price',
      name: 'Цена',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade) => Number(a.price) - Number(b.price),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Цена'
    },
    {
      id: 'date',
      name: 'Время',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade) => Number(a.date) - Number(b.date),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Время совершения сделки'
    },
    {
      id: 'volume',
      name: 'Объем',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade) => b.volume - a.volume,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Объём'
    },
  ];
  listOfColumns: Column<DisplayTrade, TradeFilter>[] = [];
  scrollHeight$: Observable<number> = of(100);
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private settings$!: Observable<BlotterSettings>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: BlotterService,
    private readonly timezoneConverterService: TimezoneConverterService) {
  }

  ngAfterViewInit(): void {
    if(this.tableContainer) {
      this.scrollHeight$ = TableAutoHeightBehavior.getScrollHeight(this.tableContainer);
    }
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      shareReplay()
    );

    this.settings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(s => {
      const tableSettings = s.tradesTable ?? TableSettingHelper.toTableDisplaySettings(s.tradesColumns);

      if (tableSettings) {
        this.listOfColumns = this.allColumns
          .map(c => ({column: c, columnSettings: tableSettings.columns.find(x => x.columnId === c.id)}))
          .filter(c => !!c.columnSettings)
          .map(c => ({
            ...c.column,
            width: c.columnSettings!.columnWidth
          }));

        this.tableInnerWidth = this.listOfColumns.reduce((prev, cur) =>prev + (cur.width ?? this.columnDefaultWidth) , 0);
      }
    });

    const trades$ = this.settings$.pipe(
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
      mergeMap(trades => this.filter.pipe(
        map(f => trades.filter(t => this.justifyFilter(t, f)))
      ))
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  reset(): void {
    this.filter.next({});
  }

  filterChange(newFilter: TradeFilter) {
    this.filter.next({
      ...this.filter.getValue(),
      ...newFilter
    });
  }

  defaultFilterChange(key: string, value: string[]) {
    this.filterChange({ [key]: value });
  }

  getFilter(columnId: string) {
    return this.filter.getValue()[columnId as keyof TradeFilter];
  }

  shouldShow(column: string) {
    return this.listOfColumns.map(c => c.id).includes(column);
  }

  formatDate(date: Date) {
    return new Date(date).toLocaleTimeString();
  }

  isFilterApplied(column: Column<DisplayTrade, TradeFilter>) {
    const filter = this.filter.getValue();
    return column.id in filter && !!filter[column.id];
  }

  get canExport(): boolean {
    return !!this.table?.data && this.table.data.length > 0;
  }

  exportToFile() {
    const valueTranslators = new Map<string, (value: any) => string>([
      ['date', value => this.formatDate(value)]
    ]);

    this.settings$.pipe(take(1)).subscribe(settings => {
      ExportHelper.exportToCsv(
        'Сделки',
        settings,
        [...this.table?.data ?? []],
        this.listOfColumns,
        valueTranslators
      );
    });
  }

  saveColumnWidth(columnId: string, width: number) {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      const tableSettings = settings.tradesTable ?? TableSettingHelper.toTableDisplaySettings(settings.tradesColumns);
      if (tableSettings) {
        this.settingsService.updateSettings<BlotterSettings>(
          settings.guid,
          {
            tradesTable: TableSettingHelper.updateColumn(
              columnId,
              tableSettings,
              {
                columnWidth: width
              }
            )
          }
        );
      }
    });
  }

  recalculateTableWidth(widthChange: { columnWidth: number, delta: number | null }) {
    const delta = widthChange.delta ?? widthChange.columnWidth - this.columnDefaultWidth;
    this.tableInnerWidth += delta;
  }

  private justifyFilter(trade: DisplayTrade, filter: TradeFilter): boolean {
    let isFiltered = true;
    for (const key of Object.keys(filter)) {
      if (filter[key as keyof TradeFilter]) {
        const column = this.listOfColumns.find(o => o.id == key);
        if (
          column?.hasSearch && !column.searchFn!(trade, filter) ||
          column?.hasFilter && filter[key]?.length  && !filter[key]?.includes((trade as any)[key])
        ) {
          isFiltered = false;
        }
      }
    }
    return isFiltered;
  }
}
