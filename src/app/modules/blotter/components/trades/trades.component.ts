import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
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
import { TradeFilter } from '../../models/trade-filter.model';
import { BlotterService } from '../../services/blotter.service';
import { MathHelper } from '../../../../shared/utils/math-helper';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { NzTableComponent } from 'ng-zorro-antd/table';
import { ExportHelper } from "../../utils/export-helper";
import {
  isEqualPortfolioDependedSettings
} from "../../../../shared/utils/settings-helper";
import { TableAutoHeightBehavior } from '../../utils/table-auto-height.behavior';
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { BlotterTablesHelper } from '../../utils/blotter-tables.helper';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { BlotterSettings } from '../../models/blotter-settings.model';
import { NzTableFilterList } from "ng-zorro-antd/table/src/table.types";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";

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

  @ViewChildren('tableContainer')
  tableContainer!: QueryList<ElementRef<HTMLElement>>;

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
  allColumns: BaseColumnSettings<DisplayTrade>[] = [
    {
      id: 'id',
      displayName: 'Id',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade) => Number(a.id) - Number(b.id),
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
      sortFn: (a: DisplayTrade, b: DisplayTrade) => Number(a.orderno) - Number(b.orderno),
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
      sortFn: (a: DisplayTrade, b: DisplayTrade) => a.symbol.localeCompare(b.symbol),
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
      sortFn: (a: DisplayTrade, b: DisplayTrade) => a.side.toString().localeCompare(b.side.toString()),
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
      sortFn: (a: DisplayTrade, b: DisplayTrade) => Number(a.qty) - Number(b.qty),
      tooltip: 'Количество сделок',
      minWidth: 65
    },
    {
      id: 'price',
      displayName: 'Цена',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade) => Number(a.price) - Number(b.price),
      tooltip: 'Цена'
    },
    {
      id: 'date',
      displayName: 'Время',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade) => Number(a.date) - Number(b.date),
      tooltip: 'Время совершения сделки',
      minWidth: 60
    },
    {
      id: 'volume',
      displayName: 'Объем',
      sortOrder: null,
      sortFn: (a: DisplayTrade, b: DisplayTrade) => b.volume - a.volume,
      tooltip: 'Объём',
      minWidth: 60
    },
  ];
  listOfColumns: BaseColumnSettings<DisplayTrade>[] = [];
  scrollHeight$: Observable<number> = of(100);
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private settings$!: Observable<BlotterSettings>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: BlotterService,
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly translatorService: TranslatorService
  ) {
  }

  ngAfterViewInit(): void {
    const initHeightWatching = (ref: ElementRef<HTMLElement>) => this.scrollHeight$ = TableAutoHeightBehavior.getScrollHeight(ref);

    if(this.tableContainer.length > 0) {
      initHeightWatching(this.tableContainer!.first);
    } else {
      this.tableContainer.changes.pipe(
        take(1)
      ).subscribe((x: QueryList<ElementRef<HTMLElement>>) => initHeightWatching(x.first));
    }
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid);

    this.settings$.pipe(
      distinctUntilChanged((previous, current) => TableSettingHelper.isTableSettingsEqual(previous?.positionsTable, current.positionsTable)),
      mapWith(
        () => this.translatorService.getTranslator('blotter/trades'),
        (s, t) => ({ s, t })
      ),
      takeUntil(this.destroy$)
    ).subscribe(({ s, t }) => {
      const tableSettings = s.tradesTable ?? TableSettingHelper.toTableDisplaySettings(s.tradesColumns);

      if (tableSettings) {
        this.listOfColumns = this.allColumns
          .map(c => ({column: c, columnSettings: tableSettings.columns.find(x => x.id === c.id)}))
          .filter(c => !!c.columnSettings)
          .map((column, index) => ({
            ...column.column,
            displayName: t(['columns', column.column.id, 'name'], { fallback: column.column.displayName }),
            tooltip: t(['columns', column.column.id, 'tooltip'], { fallback: column.column.tooltip }),
            filterData: column.column.filterData
              ? {
                ...column.column.filterData,
                filters: (<NzTableFilterList>column.column.filterData?.filters ?? []).map(f => ({
                  value: f.value,
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

  formatDate(date: Date) {
    return new Date(date).toLocaleTimeString();
  }

  isFilterApplied(column: BaseColumnSettings<DisplayTrade>) {
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

  saveColumnWidth(id: string, width: number) {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      const tableSettings = settings.tradesTable ?? TableSettingHelper.toTableDisplaySettings(settings.tradesColumns);
      if (tableSettings) {
        this.settingsService.updateSettings<BlotterSettings>(
          settings.guid,
          {
            tradesTable: TableSettingHelper.updateColumn(
              id,
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

  changeColumnOrder(event: CdkDragDrop<any>) {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      this.settingsService.updateSettings<BlotterSettings>(
        settings.guid,
        {
          tradesTable: BlotterTablesHelper.changeColumnOrder(
            event,
            settings.tradesTable ?? TableSettingHelper.toTableDisplaySettings(settings.tradesColumns)!,
            this.listOfColumns
          )
        }
      );
    });
  }

  trackBy(index: number, trade: DisplayTrade): string {
    return trade.id;
  }

  private justifyFilter(trade: DisplayTrade, filter: TradeFilter): boolean {
    let isFiltered = true;
    for (const key of Object.keys(filter)) {
      if (filter[key as keyof TradeFilter]) {
        const column = this.listOfColumns.find(o => o.id == key);
        if (
          !column!.filterData!.isDefaultFilter && !this.searchInTrade(trade, <keyof DisplayTrade>key, <string>filter[key]) ||
          column!.filterData!.isDefaultFilter && filter[key]?.length  && !filter[key]?.includes(trade[<keyof DisplayTrade>key]!.toString())
        ) {
          isFiltered = false;
        }
      }
    }
    return isFiltered;
  }

  private searchInTrade(order: DisplayTrade, key: keyof DisplayTrade, value?: string): boolean {
    if (!value) {
      return true;
    }
    return order[key]!.toString().toLowerCase().includes(value.toLowerCase());
  }
}
