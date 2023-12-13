import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap
} from 'rxjs';
import { WatchedInstrument } from '../../models/watched-instrument.model';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import {
  filter,
  map,
  startWith
} from 'rxjs/operators';
import { getPropertyFromPath } from "../../../../shared/utils/object-helper";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from "ng-zorro-antd/dropdown";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { toInstrumentKey } from "../../../../shared/utils/instruments";
import { TableAutoHeightBehavior } from '../../../blotter/utils/table-auto-height.behavior';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { InstrumentSelectSettings } from '../../models/instrument-select-settings.model';
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { WidgetsMetaService } from "../../../../shared/services/widgets-meta.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  Watchlist,
  WatchlistCollection,
  WatchlistType
} from "../../models/watchlist.model";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { WatchListTitleHelper } from "../../utils/watch-list-title.helper";
import { WidgetsHelper } from "../../../../shared/utils/widgets";
import { TranslatorService } from "../../../../shared/services/translator.service";

@Component({
  selector: 'ats-watchlist-table',
  templateUrl: './watchlist-table.component.html',
  styleUrls: ['./watchlist-table.component.less'],
  providers: [WatchInstrumentsService]
})
export class WatchlistTableComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly listTypes = WatchlistType;
  @Input({ required: true })
  guid!: string;

  @ViewChildren('tableContainer')
  tableContainer!: QueryList<ElementRef<HTMLElement>>;

  watchedInstruments$: Observable<WatchedInstrument[]> = of([]);
  currentWatchlist$!: Observable<Watchlist>;
  collection$!: Observable<WatchlistCollection>;

  readonly scrollHeight$ = new BehaviorSubject<number>(100);
  allColumns: BaseColumnSettings<WatchedInstrument>[] = [
    { id: 'symbol', displayName: "Тикер", tooltip: 'Биржевой идентификатор ценной бумаги', minWidth: 55 },
    { id: 'shortName', displayName: "Назв.", tooltip: 'Название тикера', minWidth: 60 },
    { id: 'price', displayName: "Цена", tooltip: 'Цена последней сделки' },
    { id: 'dayChange', displayName: "Д.изм.", tooltip: 'Изменение за день' },
    { id: 'dayChangePerPrice', displayName: "Д.изм.,%", tooltip: 'Изменение за день в %' },
    { id: 'maxPrice', displayName: "Д.макс.", tooltip: 'Максимальная цена за день' },
    { id: 'minPrice', displayName: "Д.мин.", tooltip: 'Минимальная цена за день' },
    { id: 'volume', displayName: "Объём", tooltip: 'Объём' },
    { id: 'openPrice', displayName: "Откр.", tooltip: 'Цена на начало дня' },
    { id: 'closePrice', displayName: "Закр.", tooltip: 'Цена на конец предыдущего дня' },
  ];
  displayedColumns: BaseColumnSettings<WatchedInstrument>[] = [];
  badgeColor = '';

  sortFns: { [keyName: string]: (a: InstrumentKey, b: InstrumentKey) => number } = {
    symbol: this.getSortFn('instrument.symbol'),
    price: this.getSortFn('price'),
    dayChange: this.getSortFn('dayChange'),
    dayChangePerPrice: this.getSortFn('dayChangePerPrice'),
    maxPrice: this.getSortFn('maxPrice'),
    minPrice: this.getSortFn('minPrice'),
    volume: this.getSortFn('volume'),
    openPrice: this.getSortFn('openPrice'),
    closePrice: this.getSortFn('closePrice'),
  };

  menuWidgets$!: Observable<{
    typeId: string;
    name: string;
    icon: string;
  }[]>;

  settings$!: Observable<InstrumentSelectSettings>;
  getListTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;
  private selectedItem: WatchedInstrument | null = null;
  private defaultSortFn?: (a: WatchedInstrument, b: WatchedInstrument) => number;

  constructor(
    private readonly currentDashboardService: DashboardContextService,
    private readonly settingsService: WidgetSettingsService,
    private readonly watchInstrumentsService: WatchInstrumentsService,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly nzContextMenuService: NzContextMenuService,
    private readonly dashboardService: ManageDashboardsService,
    private readonly widgetsMetaService: WidgetsMetaService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  sortFavorites = (a: WatchedInstrument, b: WatchedInstrument): number => {
    const res = (a.favoriteOrder ?? -1) - (b.favoriteOrder ?? -1);
    if (res === 0 && this.defaultSortFn) {
      return this.defaultSortFn(b, a);
    }

    return res;
  };

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<InstrumentSelectSettings>(this.guid).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.collection$ = this.watchlistCollectionService.getWatchlistCollection().pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.currentWatchlist$ = this.settings$.pipe(
      filter(s => s.activeListId != null && s.activeListId.length > 0),
      tap(settings => {
        this.displayedColumns = this.allColumns.filter(c => settings.instrumentColumns.includes(c.id));
        this.badgeColor = settings.badgeColor!;
      }),
      mapWith(
        () => this.collection$,
        (settings, collection) => collection.collection.find(x => x.id === settings.activeListId)
      ),
      filter((x): x is Watchlist => !!x),
      distinctUntilChanged((prev, curr) => prev.id === curr.id),
      tap(list => {
        if (list.type === WatchlistType.HistoryList) {
          this.defaultSortFn = (a, b): number => b.addTime - a.addTime;
        } else {
          this.defaultSortFn = (a, b): number => a.instrument.symbol.localeCompare(b.instrument.symbol);
        }
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );


    this.watchedInstruments$ = this.currentWatchlist$.pipe(
      switchMap(watchlist => this.watchInstrumentsService.getWatched(watchlist.id)),
      map(updates => {
        if (this.defaultSortFn) {
          return updates.sort(this.defaultSortFn);
        }

        return updates;
      }),
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
  }

  ngAfterViewInit(): void {
    const container$ = this.tableContainer.changes.pipe(
      map(x => x.first as ElementRef<HTMLElement> | undefined),
      startWith(this.tableContainer.first),
      filter((x): x is ElementRef<HTMLElement> => !!x),
      shareReplay(1)
    );

    container$.pipe(
      switchMap(x => TableAutoHeightBehavior.getScrollHeight(x)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      setTimeout(() => this.scrollHeight$.next(x));
    });
  }

  ngOnDestroy(): void {
    this.watchInstrumentsService.clear();
    this.scrollHeight$.complete();
  }

  makeActive(item: InstrumentKey): void {
    this.currentDashboardService.selectDashboardInstrument(item, this.badgeColor);
  }

  remove(itemId: string): void {
    this.settings$.pipe(
      map(s => s.activeListId),
      filter((id): id is string => id != null && id.length > 0),
      take(1)
    ).subscribe(activeListId => {
      this.watchlistCollectionService.removeItemsFromList(activeListId, [itemId]);
    });
  }

  getTrackKey(index: number, item: WatchedInstrument): string {
    return item.recordId;
  }

  isVisibleColumn(colName: string): boolean {
    return this.displayedColumns.map(c => c.id).includes(colName);
  }

  contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, selectedInstrument: WatchedInstrument): void {
    this.selectedItem = selectedInstrument;
    this.nzContextMenuService.create($event, menu);
  }

  addWidget(type: string): void {
    this.dashboardService.addWidget(
      type,
      {
        linkToActive: false,
        ...toInstrumentKey(this.selectedItem?.instrument!)
      }
    );
  }

  updateFavorites(item: WatchedInstrument): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      if (s.activeListId == null) {
        return;
      }

      this.watchlistCollectionService.updateListItem(
        s.activeListId,
        item.recordId,
        {
          favoriteOrder: item.favoriteOrder != null
            ? null
            : 1
        }
      );
    });
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

    this.watchlistCollectionService.addItemsToList(targetList.id, [this.selectedItem.instrument], false);
  }

  moveItem(fromList: Watchlist, toList: Watchlist): void {
    if (!this.selectedItem) {
      return;
    }

    this.watchlistCollectionService.moveItem(this.selectedItem.recordId, fromList.id, toList.id);
  }

  private getSortFn(propName: string): (a: InstrumentKey, b: InstrumentKey) => number {
    return (a: any, b: any) => {
      return getPropertyFromPath(a, propName) > getPropertyFromPath(b, propName) ? 1 : -1;
    };
  };
}
