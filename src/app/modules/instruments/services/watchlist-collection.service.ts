import { Injectable, inject } from '@angular/core';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { GuidGenerator } from '../../../shared/utils/guid';
import {
  forkJoin,
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
} from '../models/watchlist.model';
import { HttpClient } from '@angular/common/http';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { catchHttpError } from '../../../shared/utils/observable-helper';
import { toInstrumentKey } from '../../../shared/utils/instruments';
import { WatchlistCollectionBrokerService } from "./watchlist-collection-broker.service";
import {
  filter,
  map
} from "rxjs/operators";
import { InstrumentsService } from "./instruments.service";
import { EnvironmentService } from "../../../shared/services/environment.service";

@Injectable({
  providedIn: 'root'
})
export class WatchlistCollectionService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly http = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly watchlistCollectionBrokerService = inject(WatchlistCollectionBrokerService);
  private readonly instrumentsService = inject(InstrumentsService);

  public static DefaultListName = 'Список по умолчанию';
  private readonly url = this.environmentService.apiUrl + '/astras/watchlist';
  private collection$: Observable<WatchlistCollection> | null = null;

  public getWatchlistCollection(): Observable<WatchlistCollection> {
    return this.getCollection().pipe(
      filter(c => c.collection.length > 0)
    );
  }

  public createNewList(title: string, items: InstrumentKey[] | null = null): void {
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

  public removeList(listId: string): void {
    this.watchlistCollectionBrokerService.removeList(listId).subscribe();
  }

  public updateListMeta(listId: string, meta: Partial<{ title: string }>): void {
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

  public addItemsToList(listId: string, items: InstrumentKey[], rewriteDuplicates = true): void {
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

  public addItemsToHistory(items: InstrumentKey[]): void {
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
            return of(toInstrumentKey(i));
          }
          // get instrumentGroup if missing
          return this.instrumentsService.getInstrument(i).pipe(
            take(1),
            map(i => !!i ? toInstrumentKey(i) : null)
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

  public removeItemsFromList(listId: string, itemsToRemove: string[]): void {
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

  public updateListItem(listId: string, recordId: string, update: Partial<{ favoriteOrder: number | null }>): void {
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

  public moveItem(recordId: string, fromListId: string, toListId: string): void {
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

  public getPresetCollection(): Observable<PresetWatchlistCollection | null> {
    return this.http.get<PresetWatchlistCollection>(this.url)
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
        ...toInstrumentKey(x),
        recordId: GuidGenerator.newGuid(),
        addTime: Date.now()
      } as WatchlistItem))
    ];

    const uniqueItems: Record<string, WatchlistItem> = {};
    allItems.forEach(item => {
      const itemKey = this.getInstrumentKey(item);

      if(!(uniqueItems[itemKey] as WatchlistItem | undefined) || rewriteDuplicates) {
        uniqueItems[itemKey] = item;
      }
    });

    return {
      ...targetList,
      items: Object.values(uniqueItems)
    } as Watchlist;
  }
}
