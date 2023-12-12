import {
  AfterViewInit,
  Component,
  DestroyRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { BaseTableComponent } from "../base-table/base-table.component";
import {
  DisplayTrade,
  TradeFilter
} from "../../models/trade.model";
import { NzTableComponent } from "ng-zorro-antd/table";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  pairwise,
  shareReplay,
  switchMap,
  take,
  tap,
  withLatestFrom
} from "rxjs";
import {
  BaseColumnSettings,
  TableDisplaySettings
} from "../../../../shared/models/settings/table-settings.model";
import {
  allTradesColumns,
  ColumnsNames,
  TableNames
} from "../../models/blotter-settings.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterService } from "../../services/blotter.service";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  filter,
  map,
  startWith
} from "rxjs/operators";
import { Trade } from "../../../../shared/models/trades/trade.model";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { isEqualPortfolioDependedSettings } from "../../../../shared/utils/settings-helper";
import { CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { TradesHistoryService } from "../../../../shared/services/trades-history.service";

@Component({
  selector: 'ats-trades-history',
  templateUrl: './trades-history.component.html',
  styleUrls: ['./trades-history.component.less']
})
export class TradesHistoryComponent extends BaseTableComponent<DisplayTrade, TradeFilter> implements OnInit, AfterViewInit, OnDestroy {
  readonly rowHeight = 20;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  displayTrades$: Observable<DisplayTrade[]> = of([]);
  allColumns: BaseColumnSettings<DisplayTrade>[] = [
    {
      id: 'id',
      displayName: 'Id',
      sortOrder: null,
      tooltip: 'Идентификационный номер сделки'
    },
    {
      id: 'orderno',
      displayName: 'Заявка',
      sortOrder: null,
      tooltip: 'Номер заявки',
      minWidth: 80
    },
    {
      id: 'symbol',
      displayName: 'Тикер',
      sortOrder: null,
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
      tooltip: 'Количество сделок',
      minWidth: 65
    },
    {
      id: 'price',
      displayName: 'Цена',
      sortOrder: null,
      tooltip: 'Цена'
    },
    {
      id: 'date',
      displayName: 'Время',
      sortOrder: null,
      tooltip: 'Время совершения сделки',
      minWidth: 60
    },
    {
      id: 'volume',
      displayName: 'Объем',
      sortOrder: null,
      tooltip: 'Объём',
      minWidth: 60
    },
  ];
  settingsTableName = TableNames.TradesHistoryTable;
  settingsColumnsName = ColumnsNames.TradesColumns;
  fileSuffix = 'tradesHistory';
  isLoading$ = new BehaviorSubject<boolean>(false);
  private readonly loadedHistory$ = new BehaviorSubject<Trade[]>([]);

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly service: BlotterService,
    private readonly timezoneConverterService: TimezoneConverterService,
    protected readonly translatorService: TranslatorService,
    private readonly tradesHistoryService: TradesHistoryService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(service, settingsService, translatorService, destroyRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.initTableSettings();

    this.displayTrades$ = combineLatest([
        this.loadedHistory$,
        this.timezoneConverterService.getConverter()
      ]
    ).pipe(
      map(([trades, converter]) => trades.map(t => <DisplayTrade>{
        ...t,
        date: converter.toTerminalDate(t.date)
      })),
      mapWith(
        () => this.filter$,
        (data, filter) => data.filter(t => this.justifyFilter(t, filter))
      ),
      shareReplay(1)
    );
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();

    const scrollViewport$ = this.dataTableQuery.changes.pipe(
      map(x => x.first as NzTableComponent<DisplayTrade>),
      startWith(this.dataTableQuery.first),
      filter((x: NzTableComponent<DisplayTrade> | undefined): x is NzTableComponent<DisplayTrade> => !!x),
      map(x => x.cdkVirtualScrollViewport),
      filter((x): x is CdkVirtualScrollViewport => !!x),
      shareReplay(1)
    );

    const scrollDown$ = scrollViewport$.pipe(
      switchMap(x => x.scrolledIndexChange),
      startWith(null),
      pairwise(),
      filter(([first, second]) => first != null && second != null && first < second),
      map(([, second]) => second),
      filter((x): x is number => x != null)
    );

    scrollDown$.pipe(
      withLatestFrom(scrollViewport$, this.loadedHistory$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([, scrollViewport, loadedData]) => {
      if (loadedData.length === 0) {
        return;
      }

      const bufferItemsCount = 20;
      const bottomScrollOffset = scrollViewport.measureScrollOffset('bottom');
      if ((bottomScrollOffset / this.rowHeight) < bufferItemsCount) {
        const lastItem = loadedData[loadedData.length - 1];
        this.loadMoreItems(lastItem.id, 100);
      }
    });

    const settingsChange$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current))
    );

    // initial load
    combineLatest([
      settingsChange$,
      scrollViewport$
    ]).pipe(
      map(([, scrollViewport]) => scrollViewport),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(scrollViewport => {
      this.loadedHistory$.next([]);
      const itemsCount = Math.ceil(scrollViewport.measureViewportSize('vertical') / this.rowHeight);
      this.loadMoreItems(null, Math.max(itemsCount, 100));
    });

    // Due to the use of filters, only some entries may be displayed.
    // In this case, there is no scrolling and it is not possible to load more history.
    // In this case, we are trying to fill the free space
    combineLatest([
      scrollViewport$,
      this.displayTrades$
    ]).pipe(
      filter(([,displayTrades]) => displayTrades.length > 0),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([scrollViewport, displayTrades]) => {
      const itemsCount = Math.ceil(scrollViewport.measureViewportSize('vertical') / this.rowHeight);
      if(itemsCount > displayTrades.length) {
        this.loadMoreItems(null, Math.max(itemsCount, 100));
      }
    });
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.loadedHistory$.complete();
    this.isLoading$.complete();
  }

  formatDate(date: Date): string {
    return date.toLocaleTimeString(
      [],
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute:"2-digit",
        hour12: false
      }
    );
  }

  private loadMoreItems(from?: string | null, itemsCount?: number | null): void {
    this.isLoading$.pipe(
      take(1),
      filter(isLoading => !isLoading),
      tap(() => this.isLoading$.next(true)),
      withLatestFrom(this.settings$),
      switchMap(
        ([, settings]) => this.tradesHistoryService.getTradesHistoryForPortfolio(
          settings.exchange,
          settings.portfolio,
          {
            from: from,
            limit: itemsCount ?? 50
          }
        )
      ),
      tap(() => this.isLoading$.next(false)),
    ).subscribe(loadedItems => {
      if (!loadedItems || loadedItems.length === 0) {
        return;
      }

      const filteredItems = from != null
        ? loadedItems.filter(i => i.id !== from)
        : loadedItems;

      this.loadedHistory$.pipe(
        take(1)
      ).subscribe(existingItems => {
        this.loadedHistory$.next([
          ...existingItems,
          ...filteredItems
        ]);
      });
    });
  }

  private initTableSettings(): void {
    const tableSettings$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.tradesHistoryTable, current.tradesHistoryTable)
        && previous.badgeColor === current.badgeColor),
      map(s => s[this.settingsTableName] ?? TableSettingHelper.toTableDisplaySettings(allTradesColumns.filter(c => c.isDefault).map(c => c.id))),
      filter((s): s is TableDisplaySettings => !!s)
    );

    combineLatest({
      tableSettings: tableSettings$,
      translator: this.translatorService.getTranslator('blotter/trades')
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      this.listOfColumns = this.allColumns
        .map(c => ({column: c, columnSettings: x.tableSettings.columns.find(x => x.columnId === c.id)}))
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
                text: x.translator(['columns', column.column.id, 'listOfFilter', f.value], {fallback: f.text})
              }))
            }
            : undefined,
          width: column.columnSettings!.columnWidth ?? this.columnDefaultWidth,
          order: column.columnSettings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index)
        }))
        .sort((a, b) => a.order - b.order);

      this.tableInnerWidth = this.listOfColumns.reduce((prev, cur) => prev + cur.width!, 0);
    });
  }
}
