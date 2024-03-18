import {DestroyRef, Injectable} from '@angular/core';
import {combineLatest, forkJoin, Observable, of, shareReplay, take} from "rxjs";
import {Watchlist, WatchlistCollection} from "../models/watchlist.model";
import {RemoteStorageService} from "../../../shared/services/settings-broker/remote-storage.service";
import {LocalStorageService} from "../../../shared/services/local-storage.service";
import {filter, map} from "rxjs/operators";
import {EntityStatus} from "../../../shared/models/enums/entity-status";
import {ComponentStore} from "@ngrx/component-store";
import {GuidGenerator} from "../../../shared/utils/guid";
import {ApplicationMetaService} from "../../../shared/services/application-meta.service";

interface WatchlistCollectionState {
  status: EntityStatus;
  collection: Map<string, Watchlist>;
}

class WatchlistCollectionStore extends ComponentStore<WatchlistCollectionState> {
  constructor() {
    super({
      status: EntityStatus.Initial,
      collection: new Map<string, Watchlist>()
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class WatchlistCollectionBrokerService {
  private readonly store = new WatchlistCollectionStore();
  private collection$: Observable<Watchlist[]> | null = null;

  private readonly groupKey = 'watchlist-collection';
  private readonly watchlistCollectionStorageKey = 'watchlistCollection';

  constructor(
    private readonly remoteStorageService: RemoteStorageService,
    private readonly localStorageService: LocalStorageService,
    private readonly applicationMetaService: ApplicationMetaService,
    readonly destroyRef: DestroyRef
  ) {
    destroyRef.onDestroy(() => {
      this.store.ngOnDestroy();
    });
  }

  getCollection(): Observable<Watchlist[]> {
    if (!this.collection$) {
      this.collection$ = this.store.state$.pipe(
        filter(s => s.status === EntityStatus.Success),
        map(s => Array.from(s.collection.values())),
        shareReplay(1)
      );

      this.store.patchState({
        status: EntityStatus.Loading
      });

      combineLatest([
        this.applicationMetaService.getMeta(),
        this.remoteStorageService.getGroup(this.groupKey)
      ]).pipe(
        take(1)
      ).subscribe(([meta, records]) => {
        if (meta.lastResetTimestamp != null) {
          if (!!records && records.some(s => meta.lastResetTimestamp! > s.meta.timestamp)) {
            // clean settings after reset
            this.remoteStorageService.removeGroup(this.groupKey).pipe(
              map(() => null)
            ).subscribe(() => {
              this.store.patchState({
                status: EntityStatus.Success,
                collection: new Map<string, Watchlist>()
              });
            });

            return;
          }
        }

        if (!!records && records.length > 0) {
          this.store.patchState({
            status: EntityStatus.Success,
            collection: new Map<string, Watchlist>(records.map(r => [r.value.id, r.value]))
          });
        } else {
          const localData = this.localStorageService.getItem<WatchlistCollection>(this.watchlistCollectionStorageKey);
          if (!!localData) {
            const items = localData.collection.map(r => this.updateObsoleteWatchlist(r));

            this.store.patchState({
              status: EntityStatus.Success,
              collection: new Map<string, Watchlist>(items.map(r => [r.id, r]))
            });

            this.addOrUpdateLists(items).subscribe(r => {
              if (r) {
                this.localStorageService.removeItem(this.watchlistCollectionStorageKey);
              }
            });

            return;
          }

          this.store.patchState({
            status: EntityStatus.Success,
            collection: new Map<string, Watchlist>()
          });
        }
      });
    }

    return this.collection$.pipe(
      filter((x): x is Watchlist[] => !!(x as Watchlist[] | undefined))
    );
  }

  addOrUpdateLists(lists: Watchlist[]): Observable<boolean> {
    if (lists.length === 0) {
      return of(true);
    }

    this.store.patchState(state => {
      const newCollection = new Map(state.collection);
      lists.forEach(l => {
        newCollection.set(
          l.id,
          {
            ...l,
            items: l.items.map(x => ({...x}))
          });
      });

      return {
        collection: newCollection
      };
    });

    return forkJoin(
      lists.map(l => this.remoteStorageService.setRecord(
        {
          key: l.id,
          meta: {
            timestamp: this.getTimestamp()
          },
          value: l
        },
        this.groupKey)
      )
    ).pipe(
      map(r => r.every(i => !!i)),
      take(1)
    );
  }

  removeList(id: string): Observable<boolean> {
    this.store.patchState(state => {
      const newCollection = new Map(state.collection);
      newCollection.delete(id);

      return {
        collection: newCollection
      };
    });

    return this.remoteStorageService.removeRecord(id).pipe(
      take(1)
    );
  }

  private getTimestamp(): number {
    return Date.now();
  }

  private updateObsoleteWatchlist(list: Watchlist): Watchlist {
    return {
      ...list,
      items: list.items.map(i => ({
        ...i,
        recordId: (i.recordId as string | undefined) ?? GuidGenerator.newGuid()
      }))
    };
  }
}
