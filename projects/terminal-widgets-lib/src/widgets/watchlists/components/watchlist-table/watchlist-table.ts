import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {WatchedInstrument} from "../../services/watchlist-service.types";
import {
  Watchlist,
  WatchlistCollection,
  WatchlistType
} from "@terminal-core-lib/features/watchlist/types/watchlist.types";
import {
  BaseTableComponent,
  Sort
} from '@terminal-core-lib/features/tables/components/base-table';
import {
  NzTableComponent,
  NzTableModule
} from 'ng-zorro-antd/table';
import {
  animationFrameScheduler,
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  subscribeOn,
  switchMap,
  take
} from "rxjs";
import {WatchlistsWidgetSettings} from '@terminal-widgets-lib/widgets/watchlists/widget-settings.types';
import {
  BaseColumnSettings,
  TableConfig
} from "@terminal-core-lib/features/tables/types/table-display-settings.types";
import {WatchListTitleHelper} from "@terminal-core-lib/features/watchlist/utils/watchlist-title.hepler";
import {ACTIONS_CONTEXT} from "@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types";
import {WatchlistService} from '@terminal-widgets-lib/widgets/watchlists/services/watchlist.service';
import {WatchlistCollectionService} from "@terminal-core-lib/features/watchlist/services/watchlist-collection.service";
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from "ng-zorro-antd/dropdown";
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {DesktopDashboardContextService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-dashboard-context.service';
import {WidgetsMetaService} from '@terminal-core-lib/features/widgets-gallery/services/widgets-meta.service';
import {TranslatorService} from "@terminal-core-lib/features/translations/services/translator.service";
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList
} from "@angular/cdk/drag-drop";
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  CsvFormatter,
  csvFormatterConfigDefaults,
  ExportColumnMeta
} from '@terminal-core-lib/common/utils/files/csv-formatter';
import {
  FileSaver,
  FileType
} from '@terminal-core-lib/common/utils/files/file-saver';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {WidgetsHelper} from '@terminal-widgets-lib/common/utils/widget-name.helper';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';
import {ObjectHelper} from '@terminal-core-lib/common/utils/object.helper';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {LetDirective} from '@ngrx/component';
import {TableRowHeight} from '@terminal-core-lib/common/directives/table-row-height';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {ResizeColumn} from '@terminal-core-lib/common/directives/resize-column';
import {
  AsyncPipe,
  DecimalPipe
} from '@angular/common';
import {InstrumentBadgeDisplay} from '@terminal-core-lib/common/components/instrument-badge-display/instrument-badge-display';
import {PriceDiff} from '@terminal-core-lib/common/components/price-diff/price-diff';
import {ShortNumber} from '@terminal-core-lib/common/components/short-number/short-number';
import {
  NzMenuDirective,
  NzMenuItemComponent,
  NzSubMenuComponent
} from 'ng-zorro-antd/menu';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';

interface DisplayInstrument extends WatchedInstrument {
  id: string;
}

interface DisplayWatchlist extends Omit<Watchlist, 'items'> {
  items: DisplayInstrument[];
}

type SortFn = (a: WatchedInstrument, b: WatchedInstrument) => number;

@Component({
  selector: 'ats-watchlist-table',
  imports: [
    NzTableModule,
    NzResizeObserverDirective,
    LetDirective,
    TableRowHeight,
    TranslocoDirective,
    CdkDropList,
    NzTooltipDirective,
    NzIconDirective,
    CdkDrag,
    ResizeColumn,
    DecimalPipe,
    InstrumentBadgeDisplay,
    PriceDiff,
    ShortNumber,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzSubMenuComponent,
    NzMenuItemComponent,
    AsyncPipe,
    NzTypographyComponent
  ],
  templateUrl: './watchlist-table.html',
  styleUrl: './watchlist-table.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistTable extends BaseTableComponent<DisplayWatchlist> implements OnInit, OnDestroy {
  readonly guid = input.required<string>();

  readonly tableContainer = viewChild.required<ElementRef<HTMLDivElement>>('tableContainer');

  readonly tableCmp = viewChild.required<NzTableComponent<DisplayWatchlist>>('tableCmp');

  readonly listTypes = WatchlistType;

  settings$!: Observable<WatchlistsWidgetSettings>;

  currentWatchlist$!: Observable<Watchlist[]>;

  collection$!: Observable<WatchlistCollection>;

  allColumns: BaseColumnSettings<DisplayWatchlist>[] = [
    {
      id: 'symbol',
      displayName: "Тикер",
      tooltip: 'Биржевой идентификатор ценной бумаги',
      minWidth: 55
    },
    {
      id: 'shortName',
      displayName: "Назв.",
      tooltip: 'Название тикера',
      minWidth: 60
    },
    {
      id: 'price',
      displayName: "Цена",
      tooltip: 'Цена последней сделки'
    },
    {
      id: 'priceChange',
      displayName: "Изм. цены",
      tooltip: 'Изменение за указанный промежуток'
    },
    {
      id: 'priceChangeRatio',
      displayName: "Изм. цены, %",
      tooltip: 'Изменение указанный промежуток в %'
    },
    {
      id: 'maxPrice',
      displayName: "Д.макс.",
      tooltip: 'Максимальная цена за день'
    },
    {
      id: 'minPrice',
      displayName: "Д.мин.",
      tooltip: 'Минимальная цена за день'
    },
    {
      id: 'volume',
      displayName: "Объём",
      tooltip: 'Объём'
    },
    {
      id: 'openPrice',
      displayName: "Откр.",
      tooltip: 'Цена на начало дня'
    },
    {
      id: 'closePrice',
      displayName: "Закр.",
      tooltip: 'Цена на конец предыдущего дня'
    },
  ];

  openedLists$!: Observable<string[]>;

  sortFns: Record<string, SortFn> = {
    symbol: this.getSortFn('instrument.symbol'),
    shortName: this.getSortFn('instrument.shortName'),
    price: this.getSortFn('price'),
    priceChange: this.getSortFn('priceChange'),
    priceChangeRatio: this.getSortFn('priceChangeRatio'),
    maxPrice: this.getSortFn('maxPrice'),
    minPrice: this.getSortFn('minPrice'),
    volume: this.getSortFn('volume'),
    openPrice: this.getSortFn('openPrice'),
    closePrice: this.getSortFn('closePrice'),
    favorites: (a, b): number => {
      return (b.favoriteOrder ?? -1) - (a.favoriteOrder ?? -1);
    }
  };

  override sort$ = new BehaviorSubject<Sort | null>({descending: false, orderBy: 'favorites'});

  menuWidgets$!: Observable<{
    typeId: string;
    name: string;
    icon: string;
  }[]>;

  getListTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;

  selectedItem: { listId: string, instrument: WatchedInstrument } | null = null;

  protected readonly actionsContext = inject(ACTIONS_CONTEXT);

  protected override settingsTableName = 'instrumentTable';

  protected override settingsColumnsName = 'instrumentColumns';

  private readonly watchInstrumentsService = inject(WatchlistService);

  private readonly watchlistCollectionService = inject(WatchlistCollectionService);

  private readonly nzContextMenuService = inject(NzContextMenuService);

  private readonly dashboardService = inject(DesktopManageDashboardsService);

  private readonly dashboardContextService = inject(DesktopDashboardContextService);

  private readonly widgetsMetaService = inject(WidgetsMetaService);

  private readonly translatorService = inject(TranslatorService);

  private isDragStarted = false;

  private scrollIntervalId: number | null = null;

  private watchlistToDrop: string | null = null;

  override ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<WatchlistsWidgetSettings>(this.guid())
      .pipe(
        shareReplay(1),
      );

    this.openedLists$ = this.settings$
      .pipe(
        map(s => (s.activeWatchlistMetas ?? [])
          .filter(w => w.isExpanded)
          .map(w => w.id)
        )
      );

    super.ngOnInit();
    this.initScrollOnDrag();
  }

  override ngOnDestroy(): void {
    this.watchInstrumentsService.clearSubscriptions();
    super.ngOnDestroy();
  }

  sortChange(dir: string | null, colId: string): void {
    if (dir == null) {
      this.sort$.next(null);
      return;
    }

    this.sort$.next({descending: dir === 'descend', orderBy: colId});
  }

  onRowClick(row: DisplayInstrument): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.actionsContext?.selectInstrument(row.instrument, s.badgeColor ?? DefaultBadge);
    });
  }

  remove(listId: string, itemId: string): void {
    this.watchlistCollectionService.removeItemsFromList(listId, [itemId]);
  }

  contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, instrument: WatchedInstrument, listId: string): void {
    this.selectedItem = {listId, instrument};
    this.nzContextMenuService.create($event, menu);
  }

  addWidget(type: string): void {
    if (this.selectedItem == null) {
      return;
    }

    this.dashboardService.addWidget(
      type,
      {
        linkToActive: false,
        ...InstrumentKeyHelper.toInstrumentKey(this.selectedItem.instrument.instrument!)
      }
    );
  }

  updateFavorites(listId: string, item: WatchedInstrument): void {
    this.watchlistCollectionService.updateListItem(
      listId,
      item.recordId,
      {
        favoriteOrder: item.favoriteOrder != null
          ? null
          : 1
      }
    );
  }

  canMoveItem(collection: WatchlistCollection): boolean {
    if (this.selectedItem == null) {
      return false;
    }

    const currentList = collection.collection.find(c => c.id === this.selectedItem!.listId);

    return currentList != null && currentList.type != WatchlistType.HistoryList;
  }

  getListsForCopyMove(collection: WatchlistCollection): Watchlist[] | null {
    if (this.selectedItem == null) {
      return null;
    }

    const filteredLists = collection.collection.filter(wl => wl.id !== this.selectedItem!.listId && wl.type !== WatchlistType.HistoryList);
    return filteredLists.length > 0
      ? filteredLists
      : null;
  }

  copyItem(targetList: Watchlist): void {
    if (!this.selectedItem) {
      return;
    }

    this.watchlistCollectionService.addItemsToList(targetList.id, [this.selectedItem.instrument.instrument], false);
  }

  moveItem(toList: Watchlist): void {
    if (!this.selectedItem) {
      return;
    }

    this.watchlistCollectionService.moveItem(this.selectedItem.instrument.recordId, this.selectedItem.listId, toList.id);
  }

  override changeColumnOrder(event: CdkDragDrop<unknown>): void {
    super.changeColumnOrder<WatchlistsWidgetSettings>(event, this.settings$);
  }

  override saveColumnWidth(event: { columnId: string, width: number }): void {
    super.saveColumnWidth<WatchlistsWidgetSettings>(event, this.settings$);
  }

  expandListChange(isExpanded: boolean, listId: string): void {
    this.settings$
      .pipe(
        take(1),
        subscribeOn(animationFrameScheduler)
      )
      .subscribe(settings => this.settingsService.updateSettings<WatchlistsWidgetSettings>(
          this.guid(),
          {
            activeWatchlistMetas: (settings.activeWatchlistMetas ?? [])
              .map(wm => wm.id === listId ? {...wm, isExpanded} : wm)
          }
        )
      );
  }

  initScrollOnDrag(): void {
    let isScrollingUp = false;
    let isScrollingDown = false;

    fromEvent<MouseEvent>(document, 'mousemove')
      .pipe(
        filter(() => this.isDragStarted),
        takeUntilDestroyed(this.destroyRef),
        subscribeOn(animationFrameScheduler)
      )
      .subscribe(e => {
        const tableContainerRect = this.tableContainer().nativeElement.getBoundingClientRect();

        const upperTrigger = tableContainerRect.top;
        const lowerTrigger = tableContainerRect.bottom;

        if (isScrollingUp && e.clientY > upperTrigger) {
          isScrollingUp = false;

          this.stopScroll();
        }

        if (isScrollingDown && e.clientY < lowerTrigger) {
          isScrollingDown = false;

          this.stopScroll();
        }

        if (!isScrollingUp && e.clientY < upperTrigger) {
          isScrollingUp = true;

          this.scrollIntervalId = setInterval(() => this.moveScroll(-1), 10);
        }

        if (!isScrollingDown && e.clientY > lowerTrigger) {
          isScrollingDown = true;

          this.scrollIntervalId = setInterval(() => this.moveScroll(1), 10);
        }
      });
  }

  onDragDropped(e: CdkDragDrop<{ listId: string, recordId: string }>): void {
    if (e.item.data.listId !== this.watchlistToDrop) {
      this.watchlistCollectionService.moveItem(e.item.data.recordId, e.item.data.listId, this.watchlistToDrop!);
    }

    this.isDragStarted = false;
    this.watchlistToDrop = null;
    this.stopScroll();
  }

  onDragStarted(): void {
    this.isDragStarted = true;
  }

  setWatchlistToDrop(listId: string): void {
    if (!this.isDragStarted) {
      return;
    }

    this.watchlistToDrop = listId;
  }

  exportToFile(listId: string): void {
    combineLatest({
      tableConfig: this.tableConfig$,
      tableData: this.tableData$,
      translator: this.translatorService.getTranslator('instruments/select')
    }).pipe(
      take(1)
    ).subscribe(x => {
      const valueTranslators = new Map<string, (item: DisplayInstrument) => string>([
        ['symbol', (item): string => item.instrument.symbol],
        ['shortName', (item): string => item.instrument.shortName],
      ]);

      const meta = x.tableConfig.columns.map(c => ({
          title: x.translator(['columns', c.id, 'name']),
          readFn: item => {
            const valueTranslator = valueTranslators.get(c.id);
            if (valueTranslator) {
              return valueTranslator(item);
            }

            return item[c.id as keyof DisplayInstrument];
          }
        } as ExportColumnMeta<DisplayInstrument>)
      );

      const selectedWatchlist = x.tableData.find(w => w.id === listId);

      if (selectedWatchlist == null) {
        return;
      }

      const tableData = selectedWatchlist.items;

      const csv = CsvFormatter.toCsv(meta, tableData, csvFormatterConfigDefaults);

      FileSaver.save({
          fileType: FileType.Csv,
          name: selectedWatchlist.title
        },
        csv);
    });
  }

  protected initTableConfigStream(): Observable<TableConfig<DisplayWatchlist>> {
    return this.settings$
      .pipe(
        map(settings => {
          const tableSettings = TableSettingHelper.toTableDisplaySettings(settings.instrumentTable, settings.instrumentColumns);

          return {
            columns: this.allColumns
              .map(column => ({column, settings: tableSettings?.columns.find(c => c.columnId === column.id)}))
              .filter(c => c.settings != null)
              .map((col, index) => ({
                ...col.column,
                order: col.settings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index),
                width: col.settings!.columnWidth ?? this.defaultColumnWidth
              }))
              .sort((a, b) => a.order - b.order)
          };
        })
      );
  }

  protected initTableDataStream(): Observable<DisplayWatchlist[]> {
    this.collection$ = this.watchlistCollectionService.getWatchlistCollection().pipe(
      shareReplay({bufferSize: 1, refCount: true})
    );

    const filteredSettings$ = this.settings$.pipe(
      distinctUntilChanged((prev, curr) =>
        JSON.stringify(prev.activeWatchlistMetas) === JSON.stringify(curr.activeWatchlistMetas)
      )
    );

    this.currentWatchlist$ = filteredSettings$.pipe(
      mapWith(
        () => this.collection$,
        (settings, collection) => {
          const watchlistIds = (settings.activeWatchlistMetas ?? []).map(wm => wm.id);
          const list = collection.collection.filter(x => watchlistIds.includes(x.id));

          if (list.length > 0) {
            return list;
          }

          return [collection.collection.find(c => c.isDefault ?? false)!];
        }
      ),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.menuWidgets$ = this.dashboardContextService.selectedDashboard$.pipe(
      switchMap(dashboard => {
        if (dashboard.isLocked ?? false) {
          return of([]);
        }

        return combineLatest([
            this.widgetsMetaService.getWidgetsMeta(),
            this.translatorService.getLangChanges()
          ]
        ).pipe(
          map(([meta, lang]) => (meta ?? [])
            .filter(x => !!x.desktopMeta && x.desktopMeta.enabled)
            .filter(x => x.hasInstrumentBind ?? false)
            .sort((a, b) => {
                return (a.desktopMeta!.galleryOrder ?? 0) - (b.desktopMeta!.galleryOrder ?? 0);
              }
            )
            .map(x => ({
              typeId: x.typeId,
              name: WidgetsHelper.getWidgetName(x.widgetName, lang),
              icon: x.desktopMeta?.galleryIcon ?? 'appstore'
            }))
          ),
          shareReplay(1)
        );
      })
    );

    return this.currentWatchlist$.pipe(
      mapWith(
        () => filteredSettings$,
        (watchLists, settings) => ({watchLists, settings})
      ),
      mapWith(
        () => this.sort$,
        ({watchLists, settings}, sort) => ({watchLists, settings, sort})
      ),
      switchMap(({watchLists, settings, sort}) =>
        combineLatest(
          watchLists.map(watchlist =>
            this.watchInstrumentsService.subscribeToListUpdates(watchlist.id, settings.priceChangeTimeframe ?? TimeframeValue.Day)
              .pipe(
                map(instruments => {
                  return {
                    ...watchlist,
                    items: instruments
                      .map(i => ({...i, id: i.recordId}))
                      .sort((a, b) => {
                        if (sort == null) {
                          return this.sortFns.favorites(a, b);
                        }

                        return sort.descending ? -this.sortFns[sort.orderBy](a, b) : this.sortFns[sort.orderBy](a, b);
                      })
                  };
                }),
                startWith({
                  ...watchlist,
                  items: []
                })
              )
          )
        ),
      ),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private getSortFn(propName: string): SortFn {
    return (a: WatchedInstrument, b: WatchedInstrument) => {
      const aValue = ObjectHelper.getPropertyFromPath(a, propName) as string | number;
      const bValue = ObjectHelper.getPropertyFromPath(b, propName) as string | number;
      return aValue > bValue ? 1 : -1;
    };
  };

  private moveScroll(multiplier: number): void {
    const initialScroll = this.tableCmp().cdkVirtualScrollViewport?.measureScrollOffset('top') ?? 0;

    this.tableCmp().cdkVirtualScrollViewport?.scrollTo({top: initialScroll + (10 * multiplier)});
  }

  private stopScroll(): void {
    if (this.scrollIntervalId != null) {
      clearInterval(this.scrollIntervalId);
    }
  }
}
