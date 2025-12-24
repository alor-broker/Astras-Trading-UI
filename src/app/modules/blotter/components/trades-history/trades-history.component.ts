import {AfterViewInit, Component, DestroyRef, inject, OnDestroy, output, viewChildren} from '@angular/core';
import {BlotterBaseTableComponent} from "../blotter-base-table/blotter-base-table.component";
import {DisplayTrade, TradeFilter} from "../../models/trade.model";
import {NzTableComponent, NzTableModule} from "ng-zorro-antd/table";
import {
  BehaviorSubject,
  combineLatest,
  defer,
  distinctUntilChanged,
  Observable,
  pairwise,
  shareReplay,
  switchMap,
  take,
  tap,
  withLatestFrom
} from "rxjs";
import {
  BaseColumnSettings,
  FilterType,
  TableDisplaySettings
} from "../../../../shared/models/settings/table-settings.model";
import {allTradesColumns, ColumnsNames, TableNames} from "../../models/blotter-settings.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {TimezoneConverterService} from "../../../../shared/services/timezone-converter.service";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {TableSettingHelper} from "../../../../shared/utils/table-setting.helper";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {debounceTime, filter, map, startWith} from "rxjs/operators";
import {Trade} from "../../../../shared/models/trades/trade.model";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {isEqualPortfolioDependedSettings} from "../../../../shared/utils/settings-helper";
import {CdkVirtualScrollViewport} from "@angular/cdk/scrolling";
import {TradesHistoryService} from "../../../../shared/services/trades-history.service";
import {TableConfig} from "../../../../shared/models/table-config.model";
import {defaultBadgeColor} from "../../../../shared/utils/instruments";
import {BlotterService} from "../../services/blotter.service";
import {NzContextMenuService, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {LetDirective} from '@ngrx/component';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {CdkDrag, CdkDropList} from '@angular/cdk/drag-drop';
import {ResizeColumnDirective} from '../../../../shared/directives/resize-column.directive';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  TableSearchFilterComponent
} from '../../../../shared/components/table-search-filter/table-search-filter.component';
import {
  AddToWatchlistMenuComponent
} from '../../../instruments/widgets/add-to-watchlist-menu/add-to-watchlist-menu.component';
import {AsyncPipe, DecimalPipe} from '@angular/common';

@Component({
  selector: 'ats-trades-history',
  templateUrl: './trades-history.component.html',
  styleUrls: ['./trades-history.component.less'],
  imports: [
    TranslocoDirective,
    NzEmptyComponent,
    LetDirective,
    NzResizeObserverDirective,
    CdkDropList,
    ResizeColumnDirective,
    CdkDrag,
    NzTooltipDirective,
    NzIconDirective,
    NzButtonComponent,
    NzDropdownMenuComponent,
    TableSearchFilterComponent,
    AddToWatchlistMenuComponent,
    AsyncPipe,
    DecimalPipe,
    NzTableModule
  ]
})
export class TradesHistoryComponent extends BlotterBaseTableComponent<DisplayTrade, TradeFilter> implements AfterViewInit, OnDestroy {
  readonly rowHeight = 20;
  readonly shouldShowSettingsChange = output<boolean>();
  allColumns: BaseColumnSettings<DisplayTrade>[] = [
    {
      id: 'id',
      displayName: 'Id',
      sortOrder: null,
      tooltip: 'Идентификационный номер сделки'
    },
    {
      id: 'orderNo',
      displayName: 'Заявка',
      sortOrder: null,
      tooltip: 'Номер заявки',
      minWidth: 80
    },
    {
      id: 'symbol',
      displayName: 'Тикер',
      sortOrder: null,
      transformFn: data => data.targetInstrument.symbol,
      filterData: {
        filterName: 'symbol',
        filterType: FilterType.Search,
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
      filterData: {
        filterName: 'side',
        filterType: FilterType.Default,
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
      sourceField: 'displayDate',
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

  isLoading$ = new BehaviorSubject<boolean>(false);
  settingsTableName = TableNames.TradesHistoryTable;
  settingsColumnsName = ColumnsNames.TradesColumns;
  fileSuffix = 'tradesHistory';
  readonly dataTableQuery = viewChildren<NzTableComponent<DisplayTrade>>('nzTable');
  protected readonly settingsService: WidgetSettingsService;
  protected readonly translatorService: TranslatorService;
  protected readonly nzContextMenuService: NzContextMenuService;
  protected readonly widgetLocalStateService: WidgetLocalStateService;
  protected readonly destroyRef: DestroyRef;
  private readonly service = inject(BlotterService);
  private readonly timezoneConverterService = inject(TimezoneConverterService);
  private readonly tradesHistoryService = inject(TradesHistoryService);
  private readonly dataTableQueryChanges$ = toObservable(this.dataTableQuery);

  private readonly loadedHistory$ = new BehaviorSubject<Trade[]>([]);

  constructor() {
    const settingsService = inject(WidgetSettingsService);
    const translatorService = inject(TranslatorService);
    const nzContextMenuService = inject(NzContextMenuService);
    const widgetLocalStateService = inject(WidgetLocalStateService);
    const destroyRef = inject(DestroyRef);

    super(
      settingsService,
      translatorService,
      nzContextMenuService,
      widgetLocalStateService,
      destroyRef
    );

    this.settingsService = settingsService;
    this.translatorService = translatorService;
    this.nzContextMenuService = nzContextMenuService;
    this.widgetLocalStateService = widgetLocalStateService;
    this.destroyRef = destroyRef;
  }

  get restoreFiltersAndSortOnLoad(): boolean {
    return false;
  }

  ngAfterViewInit(): void {
    const scrollViewport$ = this.dataTableQueryChanges$.pipe(
      map(x => x.length > 0 ? x[0] : undefined),
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
        this.loadMoreItems(lastItem.date, 100);
      }
    });

    const settingsChange$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current))
    );

    // initial load
    combineLatest([
      settingsChange$,
      scrollViewport$,
      // loaded data should be cleared when filters has been changed
      this.filters$.pipe(debounceTime(100))
    ]).pipe(
      map(([, scrollViewport]) => scrollViewport),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(scrollViewport => {
      const itemsCount = Math.ceil(scrollViewport.measureViewportSize('vertical') / this.rowHeight);
      this.loadMoreItems(null, Math.max(itemsCount, 100));
    });

    // Due to the use of filters, only some entries may be displayed.
    // In this case, there is no scrolling and it is not possible to load more history.
    // In this case, we are trying to fill the free space
    combineLatest([
      scrollViewport$,
      this.tableData$
    ]).pipe(
      filter(([, displayTrades]) => displayTrades.length > 0),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([scrollViewport, displayTrades]) => {
      const itemsCount = Math.ceil(scrollViewport.measureViewportSize('vertical') / this.rowHeight);
      if (itemsCount > displayTrades.length) {
        const lastItem = displayTrades[displayTrades.length - 1];
        this.loadMoreItems(lastItem.date, Math.max(itemsCount, 100));
      }
    });
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.loadedHistory$.complete();
  }

  formatDate(date: Date): string {
    return date.toLocaleTimeString(
      [],
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }
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

  protected initTableConfigStream(): Observable<TableConfig<DisplayTrade>> {
    const tableSettings$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.tradesHistoryTable, current.tradesHistoryTable)
        && previous.badgeColor === current.badgeColor),
      map(s => TableSettingHelper.toTableDisplaySettings(s[this.settingsTableName], allTradesColumns.filter(c => c.isDefault).map(c => c.id))),
      filter((s): s is TableDisplaySettings => !!s)
    );

    const tableState$ = defer(() => {
      return combineLatest({
        filters: this.getFiltersState().pipe(take(1)),
        sort: this.getSortState().pipe(take(1))
      });
    });

    return combineLatest({
      tableSettings: tableSettings$,
      translator: this.translatorService.getTranslator('blotter/trades')
    }).pipe(
      mapWith(() => tableState$, (source, output) => ({...source, ...output})),
      takeUntilDestroyed(this.destroyRef),
      tap(x => {
        if (x.filters != null) {
          this.filterChange(x.filters);
        }
      }),
      map(x => {
        return {
          columns: this.allColumns
            .map(c => ({column: c, columnSettings: x.tableSettings?.columns.find(x => x.columnId === c.id)}))
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
    return combineLatest([
        this.loadedHistory$,
        this.timezoneConverterService.getConverter()
      ]
    ).pipe(
      map(([trades, converter]) => trades.map(t => <DisplayTrade>{
        ...t,
        displayDate: converter.toTerminalDate(t.date)
      })),
      withLatestFrom(this.filters$),
      map(([data, filter]) => {
        const clearedFilter = {
          ...filter
        };

        // symbol and side filters has been applied in API call
        delete clearedFilter.symbol;
        delete clearedFilter.side;

        return data.filter(t => this.justifyFilter(t, filter));
      }),
      shareReplay(1)
    );
  }

  protected rowToInstrumentKey(row: DisplayTrade): Observable<InstrumentKey | null> {
    return this.service.getInstrumentToSelect(
      row.targetInstrument.symbol,
      row.targetInstrument.exchange,
      row.targetInstrument.instrumentGroup ?? null,
    );
  }

  private loadMoreItems(dateFrom?: Date | null, itemsCount?: number | null): void {
    this.isLoading$.pipe(
      take(1),
      filter(isLoading => !isLoading),
      tap(() => this.isLoading$.next(true)),
      withLatestFrom(this.settings$, this.filters$),
      switchMap(
        ([, settings, filters]) => this.tradesHistoryService.getTradesHistoryForPortfolio(
          settings.exchange,
          settings.portfolio,
          {
            filters,
            dateFrom,
            limit: itemsCount ?? 50
          }
        )
      ),
      tap(() => this.isLoading$.next(false)),
    ).subscribe((loadedItems) => {
      if (!loadedItems || loadedItems.length === 0) {
        return;
      }

      if (dateFrom == null) {
        this.loadedHistory$.next(loadedItems);
      } else {
        this.loadedHistory$.pipe(
          take(1)
        ).subscribe(existingItems => {
          const existingIds = new Set(existingItems.map(x => x.id));
          const uniqueItems = loadedItems.filter(x => !existingIds.has(x.id));

          if (uniqueItems.length > 0) {
            this.loadedHistory$.next([
              ...existingItems,
              ...uniqueItems
            ]);
          }
        });
      }
    });
  }
}
