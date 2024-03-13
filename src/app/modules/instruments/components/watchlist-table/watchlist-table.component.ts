import {
  Component,
  DestroyRef,
  Inject,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  Observable,
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
  map
} from 'rxjs/operators';
import { getPropertyFromPath } from "../../../../shared/utils/object-helper";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from "ng-zorro-antd/dropdown";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { defaultBadgeColor, toInstrumentKey } from "../../../../shared/utils/instruments";
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
import { BaseTableComponent } from "../../../../shared/components/base-table/base-table.component";
import { TableConfig } from "../../../../shared/models/table-config.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CdkDragDrop } from "@angular/cdk/drag-drop";

interface DisplayInstrument extends WatchedInstrument {
  id: string;
}

@Component({
  selector: 'ats-watchlist-table',
  templateUrl: './watchlist-table.component.html',
  styleUrls: ['./watchlist-table.component.less'],
  providers: [WatchInstrumentsService]
})
export class WatchlistTableComponent extends BaseTableComponent<DisplayInstrument>
  implements OnInit, OnDestroy {
  @Input({ required: true }) guid!: string;

  readonly listTypes = WatchlistType;
  settings$!: Observable<InstrumentSelectSettings>;

  currentWatchlist$!: Observable<Watchlist>;
  collection$!: Observable<WatchlistCollection>;

  allColumns: BaseColumnSettings<WatchedInstrument>[] = [
    { id: 'symbol', displayName: "Тикер", tooltip: 'Биржевой идентификатор ценной бумаги', minWidth: 55 },
    { id: 'shortName', displayName: "Назв.", tooltip: 'Название тикера', minWidth: 60 },
    { id: 'price', displayName: "Цена", tooltip: 'Цена последней сделки' },
    { id: 'priceChange', displayName: "Изм. цены", tooltip: 'Изменение за указанный промежуток' },
    { id: 'priceChangeRatio', displayName: "Изм. цены, %", tooltip: 'Изменение указанный промежуток в %' },
    { id: 'maxPrice', displayName: "Д.макс.", tooltip: 'Максимальная цена за день' },
    { id: 'minPrice', displayName: "Д.мин.", tooltip: 'Минимальная цена за день' },
    { id: 'volume', displayName: "Объём", tooltip: 'Объём' },
    { id: 'openPrice', displayName: "Откр.", tooltip: 'Цена на начало дня' },
    { id: 'closePrice', displayName: "Закр.", tooltip: 'Цена на конец предыдущего дня' },
  ];

  sortFns: { [keyName: string]: (a: InstrumentKey, b: InstrumentKey) => number } = {
    symbol: this.getSortFn('instrument.symbol'),
    price: this.getSortFn('price'),
    priceChange: this.getSortFn('priceChange'),
    priceChangeRatio: this.getSortFn('priceChangeRatio'),
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

  getListTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;
  selectedItem: WatchedInstrument | null = null;
  private defaultSortFn?: (a: WatchedInstrument, b: WatchedInstrument) => number;

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

  sortFavorites = (a: WatchedInstrument, b: WatchedInstrument): number => {
    const res = (a.favoriteOrder ?? -1) - (b.favoriteOrder ?? -1);
    if (res === 0 && this.defaultSortFn) {
      return this.defaultSortFn(b, a);
    }

    return res;
  };

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<InstrumentSelectSettings>(this.guid)
      .pipe(
        shareReplay(1),
        takeUntilDestroyed(this.destroyRef)
      );

    super.ngOnInit();
  }

  protected initTableConfigStream(): Observable<TableConfig<DisplayInstrument>> {
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

  protected initTableDataStream(): Observable<DisplayInstrument[]> {
    this.collection$ = this.watchlistCollectionService.getWatchlistCollection().pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const filteredSettings$ = this.settings$.pipe(
      distinctUntilChanged((prev, curr) => prev.activeListId === curr.activeListId)
    );

    this.currentWatchlist$ = filteredSettings$.pipe(
      filter(s => s.activeListId != null && s.activeListId.length > 0),
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
        () => filteredSettings$.pipe(
          distinctUntilChanged((prev, curr) => prev.activeListId !== curr.activeListId),
        ),
        (watchlist, settings) => ({ watchlist, settings })
      ),
      switchMap(({ watchlist, settings }) => this.watchInstrumentsService.getWatched(watchlist.id, settings.priceChangeTimeframe ?? TimeframeValue.Day)),
      map(updates => updates.map(u => ({ ...u, id: u.recordId }))),
      map(updates => {
        if (this.defaultSortFn) {
          return updates.sort(this.defaultSortFn);
        }

        return updates;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.watchInstrumentsService.clear();
  }

  rowClick(row: DisplayInstrument): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.actionsContext?.instrumentSelected(row.instrument, s.badgeColor ?? defaultBadgeColor);
    });
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

  changeColumnOrder(event: CdkDragDrop<any>): void {
    super.changeColumnOrder<InstrumentSelectSettings>(event, this.settings$);
  }

  saveColumnWidth(event: { columnId: string, width: number }): void {
    super.saveColumnWidth<InstrumentSelectSettings>(event, this.settings$);
  }

  private getSortFn(propName: string): (a: InstrumentKey, b: InstrumentKey) => number {
    return (a: any, b: any) => {
      return getPropertyFromPath(a, propName) > getPropertyFromPath(b, propName) ? 1 : -1;
    };
  };
}
