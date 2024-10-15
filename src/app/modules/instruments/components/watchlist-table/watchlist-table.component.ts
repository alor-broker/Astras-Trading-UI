import {
  Component,
  DestroyRef, ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit, ViewChild
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  fromEvent,
  Observable,
  shareReplay,
  switchMap,
  take
} from 'rxjs';
import { WatchedInstrument } from '../../models/watched-instrument.model';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import {
  map
} from 'rxjs/operators';
import { getPropertyFromPath } from "../../../../shared/utils/object-helper";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from "ng-zorro-antd/dropdown";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import {
  defaultBadgeColor,
  toInstrumentKey
} from "../../../../shared/utils/instruments";
import { InstrumentSelectSettings } from '../../models/instrument-select-settings.model';
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { WidgetsMetaService } from "../../../../shared/services/widgets-meta.service";
import {
  Watchlist,
  WatchlistCollection,
  WatchlistType
} from "../../models/watchlist.model";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { WatchListTitleHelper } from "../../utils/watch-list-title.helper";
import { WidgetsHelper } from "../../../../shared/utils/widgets";
import { TranslatorService } from "../../../../shared/services/translator.service";
import {
  ACTIONS_CONTEXT,
  ActionsContext
} from "../../../../shared/services/actions-context";
import { TimeframeValue } from "../../../light-chart/models/light-chart.models";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { BaseTableComponent, Sort } from "../../../../shared/components/base-table/base-table.component";
import { TableConfig } from "../../../../shared/models/table-config.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import {
  CsvFormatter,
  csvFormatterConfigDefaults,
  ExportColumnMeta
} from "../../../../shared/utils/file-export/csv-formatter";
import {
  FileSaver,
  FileType
} from "../../../../shared/utils/file-export/file-saver";
import { NzTableComponent } from "ng-zorro-antd/table";

interface DisplayInstrument extends WatchedInstrument {
  id: string;
}

interface DisplayWatchlist extends Omit<Watchlist, 'items'> {
  items: DisplayInstrument[];
}

type SortFn = (a: WatchedInstrument, b: WatchedInstrument) => number;

@Component({
  selector: 'ats-watchlist-table',
  templateUrl: './watchlist-table.component.html',
  styleUrls: ['./watchlist-table.component.less']
})
export class WatchlistTableComponent extends BaseTableComponent<DisplayWatchlist>
  implements OnInit, OnDestroy {
  @Input({ required: true }) guid!: string;

  @ViewChild('tableContainer') tableContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('tableCmp') tableCmp!: NzTableComponent<DisplayWatchlist>;

  private isDragStarted = false;
  private scrollIntervalId: number | null = null;
  private watchlistToDrop: string | null = null;

  readonly listTypes = WatchlistType;
  settings$!: Observable<InstrumentSelectSettings>;

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

  sort$ = new BehaviorSubject<Sort | null>({ descending: false, orderBy: 'favorites' });

  menuWidgets$!: Observable<{
    typeId: string;
    name: string;
    icon: string;
  }[]>;

  getListTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;
  selectedItem: { listId: string, instrument: WatchedInstrument } | null = null;

  protected settingsTableName = 'instrumentTable';
  protected settingsColumnsName = 'instrumentColumns';

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    private readonly watchInstrumentsService: WatchInstrumentsService,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly nzContextMenuService: NzContextMenuService,
    private readonly dashboardService: ManageDashboardsService,
    private readonly widgetsMetaService: WidgetsMetaService,
    private readonly translatorService: TranslatorService,
    @Inject(ACTIONS_CONTEXT)
    protected readonly actionsContext: ActionsContext,
    protected readonly destroyRef: DestroyRef
  ) {
    super(settingsService, destroyRef);
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<InstrumentSelectSettings>(this.guid)
      .pipe(
        shareReplay(1),
        takeUntilDestroyed(this.destroyRef)
      );

    this.openedLists$ = this.settings$
      .pipe(
        map(s => (s.activeWatchlistMetas ?? [])
          .filter(w => w.isExpanded)
          .map(w => w.id)
        ),
      );

    this.initScrollNeed();
    super.ngOnInit();
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
      shareReplay({ bufferSize: 1, refCount: true })
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

          return [collection.collection.find(c => c.isDefault)!];
        }
      ),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.menuWidgets$ = combineLatest([
        this.widgetsMetaService.getWidgetsMeta(),
        this.translatorService.getLangChanges()
      ]
    ).pipe(
      map(([meta, lang]) => meta
        .filter(x => !!x.desktopMeta && x.desktopMeta.enabled)
        .filter(x => x.hasInstrumentBind)
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

    return this.currentWatchlist$.pipe(
      mapWith(
        () => filteredSettings$,
        (watchLists, settings) => ({ watchLists, settings })
      ),
      mapWith(
        () => this.sort$,
        ({ watchLists, settings }, sort) => ({ watchLists, settings, sort})
      ),
      switchMap(({ watchLists, settings, sort }) =>
        combineLatest(
          watchLists.map(watchlist =>
            this.watchInstrumentsService.getWatched(watchlist.id, settings.priceChangeTimeframe ?? TimeframeValue.Day)
              .pipe(
                map(instruments => {
                  return {
                    ...watchlist,
                    items: instruments
                      .map(i => ({ ...i, id: i.recordId }))
                      .sort((a, b) => {
                        if (sort == null) {
                          return this.sortFns.favorites(a, b);
                        }

                        return sort.descending ? -this.sortFns[sort.orderBy](a, b) : this.sortFns[sort.orderBy](a, b);
                      })
                  };
                })
              )
          )
        )
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.watchInstrumentsService.clearAll();
  }

  sortChange(dir: string | null, colId: string): void {
    if (dir == null) {
      this.sort$.next(null);
      return;
    }

    this.sort$.next({ descending: dir === 'descend', orderBy: colId });
  }

  onRowClick(row: DisplayInstrument): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.actionsContext?.instrumentSelected(row.instrument, s.badgeColor ?? defaultBadgeColor);
    });
  }

  remove(listId: string, itemId: string): void {
    this.watchlistCollectionService.removeItemsFromList(listId, [itemId]);
  }

  contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, instrument: WatchedInstrument, listId: string): void {
    this.selectedItem = { listId, instrument };
    this.nzContextMenuService.create($event, menu);
  }

  addWidget(type: string): void {
    this.dashboardService.addWidget(
      type,
      {
        linkToActive: false,
        ...toInstrumentKey(this.selectedItem?.instrument.instrument!)
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

  canMoveItem(currentList: Watchlist): boolean {
    return currentList.type != WatchlistType.HistoryList;
  }

  getListsForCopyMove(currentList: Watchlist, collection: WatchlistCollection): Watchlist[] | null {
    const filteredLists = collection.collection.filter(wl => wl.id !== currentList.id && wl.type !== WatchlistType.HistoryList);
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

  moveItem(fromList: Watchlist, toList: Watchlist): void {
    if (!this.selectedItem) {
      return;
    }

    this.watchlistCollectionService.moveItem(this.selectedItem.instrument.recordId, fromList.id, toList.id);
  }

  changeColumnOrder(event: CdkDragDrop<any>): void {
    super.changeColumnOrder<InstrumentSelectSettings>(event, this.settings$);
  }

  saveColumnWidth(event: { columnId: string, width: number }): void {
    super.saveColumnWidth<InstrumentSelectSettings>(event, this.settings$);
  }

  expandListChange(isExpanded: boolean, listId: string): void {
    this.settings$
      .pipe(
        take(1)
      )
      .subscribe(settings => this.settingsService.updateSettings(
          this.guid,
          {
            activeWatchlistMetas: (settings.activeWatchlistMetas ?? [])
              .map(wm => wm.id === listId ? { ...wm, isExpanded } : wm)
          }
        )
      );
  }

  initScrollNeed(): void {
    let isScrollingUp = false;
    let isScrollingDown = false;

    fromEvent<MouseEvent>(document, 'mousemove')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => this.isDragStarted)
      )
      .subscribe(e => {
        const tableContainerRect = this.tableContainer.nativeElement.getBoundingClientRect();

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

          this.scrollIntervalId = setInterval(() => this.startScroll(-1),10);
        }

        if (!isScrollingDown && e.clientY > lowerTrigger) {
          isScrollingDown = true;

          this.scrollIntervalId = setInterval(() => this.startScroll(1), 10);
        }
      });
  }

  onDragDropped(e: CdkDragDrop<any>): void {
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

  private getSortFn(propName: string): SortFn {
    return (a: any, b: any) => {
      return getPropertyFromPath(a, propName) > getPropertyFromPath(b, propName) ? 1 : -1;
    };
  };

  private startScroll(multiplier: number): void {
    const initialScroll = this.tableCmp.cdkVirtualScrollViewport?.measureScrollOffset('top') ?? 0;

    this.tableCmp.cdkVirtualScrollViewport?.scrollTo({ top: initialScroll + (10 * multiplier) });
  }

  private stopScroll(): void {
    if (this.scrollIntervalId != null) {
      clearInterval(this.scrollIntervalId);
    }
  }
}
