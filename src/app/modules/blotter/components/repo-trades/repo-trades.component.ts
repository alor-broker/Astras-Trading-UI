import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input, OnDestroy, OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { NzTableComponent } from "ng-zorro-antd/table";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  filter
} from "rxjs";
import { TradeFilter } from "../../models/trade-filter.model";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { BlotterSettings } from "../../models/blotter-settings.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterService } from "../../services/blotter.service";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { debounceTime, map, mergeMap, startWith } from "rxjs/operators";
import { TableAutoHeightBehavior } from "../../utils/table-auto-height.behavior";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { NzTableFilterList } from "ng-zorro-antd/table/src/table.types";
import { isEqualPortfolioDependedSettings } from "../../../../shared/utils/settings-helper";
import { ExportHelper } from "../../utils/export-helper";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { BlotterTablesHelper } from "../../utils/blotter-tables.helper";
import { RepoTrade } from "../../../../shared/models/trades/trade.model";

@Component({
  selector: 'ats-repo-trades',
  templateUrl: './repo-trades.component.html',
  styleUrls: ['./repo-trades.component.less']
})
export class RepoTradesComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly columnDefaultWidth = 100;

  @ViewChild('nzTable')
  table?: NzTableComponent<RepoTrade>;

  @ViewChildren('tableContainer')
  tableContainer!: QueryList<ElementRef<HTMLElement>>;

  @Input({required: true})
  guid!: string;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  tableInnerWidth: number = 1000;
  displayRepoTrades$: Observable<RepoTrade[]> = of([]);
  filter = new BehaviorSubject<TradeFilter>({});
  isFilterDisabled = () => Object.keys(this.filter.getValue()).length === 0;
  allColumns: BaseColumnSettings<RepoTrade>[] = [
    {
      id: 'id',
      displayName: 'Id',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade) => Number(a.id) - Number(b.id),
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
      sortFn: (a: RepoTrade, b: RepoTrade) => Number(a.orderno) - Number(b.orderno),
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
      sortFn: (a: RepoTrade, b: RepoTrade) => a.symbol.localeCompare(b.symbol),
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
      sortFn: (a: RepoTrade, b: RepoTrade) => a.side.toString().localeCompare(b.side.toString()),
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
      sortFn: (a: RepoTrade, b: RepoTrade) => Number(a.qty) - Number(b.qty),
      tooltip: 'Количество сделок',
      minWidth: 65
    },
    {
      id: 'price',
      displayName: 'Цена',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade) => Number(a.price) - Number(b.price),
      tooltip: 'Цена'
    },
    {
      id: 'date',
      displayName: 'Время',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade) => Number(a.date) - Number(b.date),
      tooltip: 'Время совершения сделки',
      minWidth: 60
    },
    {
      id: 'value',
      displayName: 'Объем',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade) => Number(b.repoSpecificFields.value) - Number(a.repoSpecificFields.value),
      filterData: {
        filterName: 'repoSpecificFields.value',
        isDefaultFilter: false
      },
      tooltip: 'Объём',
      minWidth: 60
    },
    {
      id: 'repoRate',
      displayName: '% годовых',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade) => Number(b.repoSpecificFields.repoRate) - Number(a.repoSpecificFields.repoRate),
      filterData: {
        filterName: 'repoSpecificFields.repoRate',
        isDefaultFilter: false
      },
      tooltip: '% годовых',
      minWidth: 60
    },
    {
      id: 'extRef',
      displayName: 'Пользователь внеш. системы',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade) => a.repoSpecificFields.extRef.toString().localeCompare(b.repoSpecificFields.extRef.toString()),
      filterData: {
        filterName: 'repoSpecificFields.extRef',
        isDefaultFilter: false
      },
      tooltip: 'Пользователь внеш. системы',
      minWidth: 60
    },
    {
      id: 'repoTerm',
      displayName: 'Срок',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade) => Number(b.repoSpecificFields.repoTerm) - Number(a.repoSpecificFields.repoTerm),
      filterData: {
        filterName: 'repoSpecificFields.repoTerm',
        isDefaultFilter: false
      },
      tooltip: 'Срок РЕПО',
      minWidth: 50
    },
    {
      id: 'account',
      displayName: 'Торговый счёт',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade) => a.repoSpecificFields.account.toString().localeCompare(b.repoSpecificFields.account.toString()),
      filterData: {
        filterName: 'repoSpecificFields.account',
        isDefaultFilter: false
      },
      tooltip: 'Торговый счёт',
      minWidth: 60
    },
    {
      id: 'tradeTypeInfo',
      displayName: 'Тип',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade) => a.repoSpecificFields.tradeTypeInfo.toString().localeCompare(b.repoSpecificFields.tradeTypeInfo.toString()),
      filterData: {
        filterName: 'repoSpecificFields.tradeTypeInfo',
        isDefaultFilter: false
      },
      tooltip: 'Тип',
      minWidth: 60
    },
    {
      id: 'yield',
      displayName: 'Доход',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade) => Number(b.repoSpecificFields.yield) - Number(a.repoSpecificFields.yield),
      filterData: {
        filterName: 'repoSpecificFields.yield',
        isDefaultFilter: false
      },
      tooltip: 'Доход',
      minWidth: 50
    },
  ];
  listOfColumns: BaseColumnSettings<RepoTrade>[] = [];
  readonly scrollHeight$ = new BehaviorSubject<number>(100);
  private settings$!: Observable<BlotterSettings>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: BlotterService,
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngAfterViewInit(): void {
    const container$ =  this.tableContainer.changes.pipe(
      map(x => x.first),
      startWith(this.tableContainer.first),
      filter((x): x is ElementRef<HTMLElement> => !!x),
      shareReplay(1)
    );

    container$.pipe(
      switchMap((x) => TableAutoHeightBehavior.getScrollHeight(x)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      setTimeout(()=> this.scrollHeight$.next(x));
    });
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid);

    this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous?.repoTradesTable, current.repoTradesTable)
        && previous.badgeColor === current.badgeColor
      ),
      mapWith(
        () => this.translatorService.getTranslator('blotter/trades'),
        (s, tTrades) => ({ s, tTrades })
      ),
      mapWith(
        () => this.translatorService.getTranslator('blotter/repo-trades'),
        ({ s, tTrades }, tRepoTrades) => ({ s, tTrades, tRepoTrades })
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ s, tTrades, tRepoTrades }) => {
      const tableSettings = s.repoTradesTable;

      if (tableSettings) {
        this.listOfColumns = this.allColumns
          .map(c => ({column: c, columnSettings: tableSettings.columns.find(x => x.columnId === c.id)}))
          .filter(c => !!c.columnSettings)
          .map((column, index) => ({
            ...column.column,
            displayName: tTrades(
              ['columns', column.column.id, 'name'],
              {
                fallback: tRepoTrades(['columns', column.column.id, 'name'], {falback: column.column.displayName})
              }
            ),
            tooltip: tTrades(
              ['columns', column.column.id, 'tooltip'],
              {
                fallback: tRepoTrades(['columns', column.column.id, 'tooltip'], {falback: column.column.tooltip})
              }
            ),
            filterData: column.column.filterData
              ? {
                ...column.column.filterData,
                filterName: tTrades(
                  ['columns', column.column.id, 'name'],
                  {
                    fallback: tRepoTrades(['columns', column.column.id, 'name'], {falback: column.column.displayName})
                  }
                ),
                filters: (<NzTableFilterList>column.column.filterData?.filters ?? []).map(f => ({
                  value: f.value,
                  text: tTrades(['columns', column.column.id, 'listOfFilter', f.value], {fallback: f.text})
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
      switchMap(settings => this.service.getRepoTrades(settings)),
      debounceTime(100),
      startWith([])
    );

    this.displayRepoTrades$ = combineLatest([
        trades$,
        this.timezoneConverterService.getConverter()
      ]
    ).pipe(
      map(([trades, converter]) => trades.map((t: RepoTrade) => <RepoTrade>{
        ...t,
        date: converter.toTerminalDate(t.date)
      })),
      mergeMap(trades => this.filter.pipe(
        map(f => trades.filter((t: RepoTrade) => this.justifyFilter(t, f)))
      ))
    );
  }

  ngOnDestroy(): void {
    this.scrollHeight$.complete();
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

  isFilterApplied(column: BaseColumnSettings<RepoTrade>) {
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
        'Сделки РЕПО',
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
      const tableSettings = settings.repoTradesTable!;
      if (tableSettings) {
        this.settingsService.updateSettings<BlotterSettings>(
          settings.guid,
          {
            repoTradesTable: TableSettingHelper.updateColumn(
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
          repoTradesTable: BlotterTablesHelper.changeColumnOrder(
            event,
            settings.repoTradesTable!,
            this.listOfColumns
          )
        }
      );
    });
  }

  trackBy(index: number, trade: RepoTrade): string {
    return trade.id;
  }

  private justifyFilter(trade: RepoTrade, filter: TradeFilter): boolean {
    let isFiltered = true;
    for (const key of Object.keys(filter)) {
      if (filter[key as keyof TradeFilter]) {
        const column = this.listOfColumns.find(o => o.id == key);
        if (
          !column!.filterData!.isDefaultFilter && !this.searchInTrade(trade, <keyof RepoTrade>key, <string>filter[key]) ||
          column!.filterData!.isDefaultFilter && filter[key]?.length  && !filter[key]?.includes(trade[<keyof RepoTrade>key]!.toString())
        ) {
          isFiltered = false;
        }
      }
    }
    return isFiltered;
  }

  private searchInTrade(trade: RepoTrade, key: keyof RepoTrade, value?: string): boolean {
    if (!value) {
      return true;
    }

    return (trade[key] ?? trade.repoSpecificFields[<keyof RepoTrade['repoSpecificFields']>key])!.toString().toLowerCase().includes(value.toLowerCase());
  }
}
