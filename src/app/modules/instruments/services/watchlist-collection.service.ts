import { Injectable } from '@angular/core';
import { WatchList, WatchListCollection } from '../models/watch-list.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { GuidGenerator } from '../../../shared/utils/guid';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WatchlistCollectionService {
  private readonly watchlistStorage = 'watchlist';
  private readonly watchlistCollectionStorage = 'watchlistCollection';
  private readonly collectionChangedSub = new Subject();

  public readonly collectionChanged$ = this.collectionChangedSub.asObservable();

  public static getInstrumentKey(instrument: InstrumentKey): string {
    return `${instrument.exchange}.${instrument.instrumentGroup}.${instrument.symbol}`;
  }

  public getWatchlistCollection(): WatchListCollection {
    const existedCollection = this.readLocalStorage<WatchListCollection>(this.watchlistCollectionStorage);
    if (!existedCollection) {
      const defaultCollection = this.createDefaultCollection();
      this.saveCollection(defaultCollection);
      return defaultCollection;
    }

    return existedCollection;
  }

  public createNewList(title: string, items: InstrumentKey[] | null = null): string {
    const newList = {
      id: GuidGenerator.newGuid(),
      title: title,
      items: items ?? []
    } as WatchList;

    const collection = this.getWatchlistCollection();
    collection.collection.unshift(newList);

    this.saveCollection(collection);
    this.collectionChangedSub.next(null);

    return newList.id;
  }

  public removeList(listId: string) {
    const collection = this.getWatchlistCollection();
    const list = collection.collection.find(x => x.id === listId);

    if (!list) {
      return;
    }

    collection.collection = collection.collection.filter(x => x.id !== listId);
    this.saveCollection(collection);
    this.collectionChangedSub.next(null);
  }

  public updateListMeta(listId: string, meta: Partial<{ title: string }>) {
    const collection = this.getWatchlistCollection();
    const listIndex = collection.collection.findIndex(x => x.id === listId);
    if (listIndex < 0) {
      return;
    }

    collection.collection[listIndex] = {
      ...collection.collection[listIndex],
      ...meta
    } as WatchList;

    this.saveCollection(collection);
    this.collectionChangedSub.next(null);
  }

  public addItemsToList(listId: string, items: InstrumentKey[]) {
    const collection = this.getWatchlistCollection();
    const list = collection.collection.find(x => x.id === listId);
    if (!list) {
      return;
    }

    list.items.push(...items);

    const uniqueItems = new Map(list.items.map(x => [WatchlistCollectionService.getInstrumentKey(x), x])).values();
    list.items = Array.from(uniqueItems);

    this.saveCollection(collection);
    this.collectionChangedSub.next(null);
  }

  public removeItemsFromList(listId: string, items: InstrumentKey[]) {
    const collection = this.getWatchlistCollection();
    const list = collection.collection.find(x => x.id === listId);
    if (!list) {
      return;
    }

    list.items = list.items.filter(item => !items.find(x => WatchlistCollectionService.getInstrumentKey(x) === WatchlistCollectionService.getInstrumentKey(item)));

    this.saveCollection(collection);
    this.collectionChangedSub.next(null);
  }

  public getListItems(listId: string): InstrumentKey[] | undefined {
    const collection = this.getWatchlistCollection();
    const list = collection.collection.find(x => x.id === listId);
    if (!list) {
      return undefined;
    }

    return list.items;
  }

  private readLocalStorage<T>(key: string): T | undefined {
    const json = localStorage.getItem(key);
    if (!json) {
      return undefined;
    }

    return JSON.parse(json) as T;
  }

  private saveCollection(collection: WatchListCollection) {
    localStorage.setItem(this.watchlistCollectionStorage, JSON.stringify(collection));
  }

  private createDefaultCollection(): WatchListCollection {
    const oldWatchlist = this.readLocalStorage<InstrumentKey[]>(this.watchlistStorage) ?? [];
    return {
      collection: [
        {
          id: GuidGenerator.newGuid(),
          title: 'Список по-умолчанию',
          isDefault: true,
          items: oldWatchlist
        } as WatchList
      ]
    } as WatchListCollection;
  }
}
