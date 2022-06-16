import { Injectable } from '@angular/core';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { GuidGenerator } from '../../../shared/utils/guid';
import {
  Observable,
  Subject
} from 'rxjs';
import {
  PresetWatchlistCollection,
  Watchlist,
  WatchlistCollection
} from '../models/watchlist.model';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { catchHttpError } from '../../../shared/utils/observable-helper';
import { LocalStorageService } from "../../../shared/services/local-storage.service";

@Injectable({
  providedIn: 'root'
})
export class WatchlistCollectionService {
  private readonly url = environment.apiUrl + '/astras/watchlist';
  private readonly watchlistStorage = 'watchlist';
  private readonly watchlistCollectionStorage = 'watchlistCollection';
  private readonly collectionChangedSub = new Subject();
  public readonly collectionChanged$ = this.collectionChangedSub.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly localStorage: LocalStorageService,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
  }

  public static getInstrumentKey(instrument: InstrumentKey): string {
    return `${instrument.exchange}.${instrument.instrumentGroup}.${instrument.symbol}`;
  }

  public getWatchlistCollection(): WatchlistCollection {
    const existedCollection = this.localStorage.getItem<WatchlistCollection>(this.watchlistCollectionStorage);
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
    } as Watchlist;

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
    } as Watchlist;

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

  public getPresetCollection(): Observable<PresetWatchlistCollection | null> {
    return this.http.get<PresetWatchlistCollection>(this.url)
      .pipe(
        catchHttpError<PresetWatchlistCollection | null>(null, this.errorHandlerService)
      );
  }

  private saveCollection(collection: WatchlistCollection) {
    this.localStorage.setItem(this.watchlistCollectionStorage, collection);
  }

  private createDefaultCollection(): WatchlistCollection {
    const oldWatchlist = this.localStorage.getItem<InstrumentKey[]>(this.watchlistStorage) ?? [];
    return {
      collection: [
        {
          id: GuidGenerator.newGuid(),
          title: 'Список по-умолчанию',
          isDefault: true,
          items: oldWatchlist
        } as Watchlist
      ]
    } as WatchlistCollection;
  }
}
