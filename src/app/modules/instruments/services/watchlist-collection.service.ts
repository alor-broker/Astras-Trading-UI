import {Injectable} from '@angular/core';
import {InstrumentKey} from '../../../shared/models/instruments/instrument-key.model';
import {GuidGenerator} from '../../../shared/utils/guid';
import {Observable, shareReplay, take, tap} from 'rxjs';
import {PresetWatchlistCollection, Watchlist, WatchlistCollection, WatchlistItem} from '../models/watchlist.model';
import {environment} from '../../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {ErrorHandlerService} from '../../../shared/services/handle-error/error-handler.service';
import {catchHttpError} from '../../../shared/utils/observable-helper';
import {toInstrumentKey} from '../../../shared/utils/instruments';
import {WatchlistCollectionBrokerService} from "./watchlist-collection-broker.service";
import {filter, map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class WatchlistCollectionService {
  public static DefaultListName = 'Список по умолчанию';
  private readonly url = environment.apiUrl + '/astras/watchlist';
  private collection$: Observable<WatchlistCollection> | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly watchlistCollectionBrokerService: WatchlistCollectionBrokerService
  ) {
  }

  public static getInstrumentKey(instrument: InstrumentKey): string {
    return `${instrument.exchange}.${instrument.instrumentGroup}.${instrument.symbol}`;
  }

  public getWatchlistCollection(): Observable<WatchlistCollection> {
    return this.getCollection().pipe(
      filter(c=> c.collection.length > 0)
    );
  }

  public createNewList(title: string, items: InstrumentKey[] | null = null) {
    const newList = {
      id: GuidGenerator.newGuid(),
      title: title,
      items: (items ?? []).map(x=> ({
        ...x,
        recordId: GuidGenerator.newGuid()
      }) as WatchlistItem)
    } as Watchlist;

    this.watchlistCollectionBrokerService.addOrUpdateLists([newList]).subscribe();
  }

  public removeList(listId: string) {
    this.watchlistCollectionBrokerService.removeList(listId).subscribe();
  }

  public updateListMeta(listId: string, meta: Partial<{ title: string }>) {
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

  public addItemsToList(listId: string, items: InstrumentKey[]) {
    this.getCollection().pipe(
      take(1)
    ).subscribe(collection => {
      const list = collection.collection.find(x => x.id === listId);
      if (!list) {
        return;
      }

      const allItems = [
        ...list.items,
        ...items.map(x => ({
          ...toInstrumentKey(x),
          recordId: GuidGenerator.newGuid()
        } as WatchlistItem))
      ];

      const updatedList = {
        ...list,
        items: Array.from(new Map(allItems.map(x => [WatchlistCollectionService.getInstrumentKey(x), x])).values())
      } as Watchlist;

      this.watchlistCollectionBrokerService.addOrUpdateLists([updatedList]).subscribe();
    });
  }

  public removeItemsFromList(listId: string, itemsToRemove: string[]) {
    this.getCollection().pipe(
      take(1)
    ).subscribe(collection => {
      const list = collection.collection.find(x => x.id === listId);
      if (!list) {
        return;
      }

      const updatedList = {
        ...list,
        items: list.items.filter(item => !itemsToRemove.includes(item.recordId))
      } as Watchlist;

      this.watchlistCollectionBrokerService.addOrUpdateLists([updatedList]).subscribe();
    });
  }

  public getPresetCollection(): Observable<PresetWatchlistCollection | null> {
    return this.http.get<PresetWatchlistCollection>(this.url)
      .pipe(
        catchHttpError<PresetWatchlistCollection | null>(null, this.errorHandlerService)
      );
  }

  private getCollection(): Observable<WatchlistCollection> {
    if (!this.collection$) {
      this.collection$ = this.watchlistCollectionBrokerService.getCollection().pipe(
        tap(x => {
          if (x.length === 0) {
            this.watchlistCollectionBrokerService.addOrUpdateLists([this.createDefaultList()]).subscribe();
          }
        }),
        map(x => ({
          collection: x
        })),
        shareReplay(1)
      );
    }

    return this.collection$;
  }

  private createDefaultList(): Watchlist {
    return {
      id: GuidGenerator.newGuid(),
      title: WatchlistCollectionService.DefaultListName,
      isDefault: true,
      items: []
    } as Watchlist;
  }
}
