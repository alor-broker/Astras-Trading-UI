import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {WatchlistCollectionBrokerService} from "./watchlist-collection-broker.service";
import {ErrorHandlerService} from "../../errors-handler/error-handler.service";
import {
  CORE_API_URL_PROVIDER,
  CoreApiUrlProvider
} from '../../../config/api-url-providers';
import {InstrumentsService} from '../../instruments/services/instruments.service'
import {
  filter,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  take,
  tap
} from 'rxjs';
import {
  PresetWatchlistCollection,
  Watchlist,
  WatchlistCollection,
  WatchlistItem,
  WatchlistType
} from '../types/watchlist.types';
import {InstrumentKey} from "../../../common/types/instrument.types";
import {GuidGenerator} from "../../../common/utils/guid-generator";
import {InstrumentKeyHelper} from '../../../common/utils/instrument-key.helper';
import {catchHttpError} from "../../../common/utils/observable/catch-http-error";

@Injectable()
export class WatchlistCollectionService {
  public static DefaultListName = 'Список по умолчанию';

  private readonly coreApiUrlProvider = inject<CoreApiUrlProvider>(CORE_API_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly watchlistCollectionBrokerService = inject(WatchlistCollectionBrokerService);

  private readonly instrumentsService = inject(InstrumentsService);

  private readonly url = this.coreApiUrlProvider.apiUrl + '/astras/watchlist';

  private collection$: Observable<WatchlistCollection> | null = null;

  getWatchlistCollection(): Observable<WatchlistCollection> {
    return this.getCollection().pipe(
      filter(c => c.collection.length > 0)
    );
  }

  createNewList(title: string, items: InstrumentKey[] | null = null): void {
    const newList = {
      id: GuidGenerator.newGuid(),
      title: title,
      items: (items ?? []).map(x => ({
        ...x,
        recordId: GuidGenerator.newGuid()
      }) as WatchlistItem)
    } as Watchlist;

    this.watchlistCollectionBrokerService.addOrUpdateLists([newList]).subscribe();
  }

  removeList(listId: string): void {
    this.watchlistCollectionBrokerService.removeList(listId).subscribe();
  }

  updateListMeta(listId: string, meta: Partial<{ title: string }>): void {
    this.getCollection().pipe(
      take(1)
    ).subscribe(collection => {
      const listIndex = collection.collection.findIndex(x => x.id === listId);
      if (listIndex < 0) {
        return;
      }

      const updatedList = {
        ...collection.collection[listIndex],
        ...meta
      } as Watchlist;

      this.watchlistCollectionBrokerService.addOrUpdateLists([updatedList]).subscribe();
    });
  }

  addItemsToList(listId: string, items: InstrumentKey[], rewriteDuplicates = true): void {
    this.getCollection().pipe(
      take(1)
    ).subscribe(collection => {
      const list = collection.collection.find(x => x.id === listId);
      if (!list) {
        return;
      }

      const updatedList = this.addItemsToListInternal(items, list, rewriteDuplicates);

      this.watchlistCollectionBrokerService.addOrUpdateLists([updatedList]).subscribe();
    });
  }

  addItemsToHistory(items: InstrumentKey[]): void {
    this.getCollection().pipe(
      take(1)
    ).subscribe(collection => {
      const list = collection.collection.find(x => x.type === WatchlistType.HistoryList);
      if (!list) {
        return;
      }

      forkJoin(
        items.map(i => {
          if (i.instrumentGroup != null && i.instrumentGroup.length > 0) {
            return of(InstrumentKeyHelper.toInstrumentKey(i));
          }
          // get instrumentGroup if missing
          return this.instrumentsService.getInstrument(i).pipe(
            take(1),
            map(i => i ? InstrumentKeyHelper.toInstrumentKey(i) : null)
          );
        })
      ).pipe(
        take(1)
      ).subscribe(items => {
        const uniqueItems: Record<string, WatchlistItem | undefined> = {};
        list.items.forEach(item => uniqueItems[this.getInstrumentKey(item)] = item);

        let newItemsAdded = false;

        items.filter((i): i is InstrumentKey => !!i)
          .forEach(i => {
            const itemKey = this.getInstrumentKey(i);
            if (!uniqueItems[itemKey]) {
              uniqueItems[itemKey] = {
                ...i,
                recordId: GuidGenerator.newGuid(),
                addTime: Date.now()
              };

              newItemsAdded = true;
            }
          });

        if (!newItemsAdded) {
          // performance optimization
          // prevent collection updating when no new items were added
          return;
        }

        const updatedList = {
          ...list,
          items: Array.from(Object.values(uniqueItems)).slice(-25)
        } as Watchlist;

        this.watchlistCollectionBrokerService.addOrUpdateLists([updatedList]).subscribe();
      });
    });
  }

  removeItemsFromList(listId: string, itemsToRemove: string[]): void {
    this.getCollection().pipe(
      take(1)
    ).subscribe(collection => {
      const list = collection.collection.find(x => x.id === listId);
      if (!list) {
        return;
      }

      const updatedList = this.removeItemsFromListInternal(itemsToRemove, list);

      this.watchlistCollectionBrokerService.addOrUpdateLists([updatedList]).subscribe();
    });
  }

  updateListItem(listId: string, recordId: string, update: Partial<{ favoriteOrder: number | null }>): void {
    this.getCollection().pipe(
      take(1)
    ).subscribe(collection => {
      const list = collection.collection.find(x => x.id === listId);
      if (!list) {
        return;
      }

      const targetItemIndex = list.items.findIndex(i => i.recordId === recordId);
      if (targetItemIndex < 0) {
        return;
      }

      const updated = [...list.items];
      updated[targetItemIndex] = {
        ...updated[targetItemIndex],
        ...update
      };

      const updatedList = {
        ...list,
        items: updated
      } as Watchlist;

      this.watchlistCollectionBrokerService.addOrUpdateLists([updatedList]).subscribe();
    });
  }

  moveItem(recordId: string, fromListId: string, toListId: string): void {
    this.getCollection().pipe(
      take(1)
    ).subscribe(collection => {
      const fromList = collection.collection.find(x => x.id === fromListId);
      if (!fromList) {
        return;
      }

      const targetItem = fromList.items.find(i => i.recordId === recordId);

      if (!targetItem) {
        return;
      }

      const toList = collection.collection.find(x => x.id === toListId);
      if (!toList) {
        return;
      }

      const fromListUpdated = this.removeItemsFromListInternal([targetItem.recordId!], fromList);
      const toListUpdated = this.addItemsToListInternal([targetItem], toList, false);

      this.watchlistCollectionBrokerService.addOrUpdateLists([toListUpdated, fromListUpdated]).subscribe();
    });
  }

  getPresetCollection(): Observable<PresetWatchlistCollection | null> {
    return this.httpClient.get<PresetWatchlistCollection>(this.url)
      .pipe(
        catchHttpError<PresetWatchlistCollection | null>(null, this.errorHandlerService)
      );
  }

  private getCollection(): Observable<WatchlistCollection> {
    this.collection$ ??= this.watchlistCollectionBrokerService.getCollection().pipe(
      tap(x => {
        const newLists: Watchlist[] = [];
        if (x.length === 0) {
          newLists.push({
            id: GuidGenerator.newGuid(),
            title: WatchlistCollectionService.DefaultListName,
            isDefault: true,
            type: WatchlistType.DefaultList,
            items: []
          });
        }

        if (!x.find(x => x.type === WatchlistType.HistoryList)) {
          newLists.push({
            id: GuidGenerator.newGuid(),
            title: "History",
            type: WatchlistType.HistoryList,
            items: []
          });
        }

        if (newLists.length > 0) {
          this.watchlistCollectionBrokerService.addOrUpdateLists(newLists).subscribe();
        }
      }),
      map(x => ({
        collection: x
      })),
      shareReplay(1)
    );

    return this.collection$;
  }

  private getInstrumentKey(instrument: InstrumentKey): string {
    return `${instrument.exchange}:${instrument.symbol}:${instrument.instrumentGroup ?? '-'}`;
  }

  private removeItemsFromListInternal(idsToRemove: string[], targetList: Watchlist): Watchlist {
    return {
      ...targetList,
      items: targetList.items.filter(item => !idsToRemove.includes(item.recordId!))
    } as Watchlist;
  }

  private addItemsToListInternal(items: InstrumentKey[], targetList: Watchlist, rewriteDuplicates = true): Watchlist {
    const allItems = [
      ...targetList.items,
      ...items.map(x => ({
        ...InstrumentKeyHelper.toInstrumentKey(x),
        recordId: GuidGenerator.newGuid(),
        addTime: Date.now()
      } as WatchlistItem))
    ];

    const uniqueItems: Record<string, WatchlistItem> = {};
    allItems.forEach(item => {
      const itemKey = this.getInstrumentKey(item);

      if (!(uniqueItems[itemKey] as WatchlistItem | undefined) || rewriteDuplicates) {
        uniqueItems[itemKey] = item;
      }
    });

    return {
      ...targetList,
      items: Object.values(uniqueItems)
    } as Watchlist;
  }
}
