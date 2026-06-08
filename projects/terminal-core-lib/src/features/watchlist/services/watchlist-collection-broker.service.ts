import {
  DestroyRef,
  inject,
  Injectable
} from '@angular/core';
import {RemoteStorageService} from '../../remote-storage/remote-storage.service';
import {LocalStorageService} from '../../local-storage/local-storage.service';
import {ApplicationMetaService} from '../../application-meta/application-meta.service';
import {EntityStatus} from '../../../common/types/entity-status.types';
import {
  Watchlist,
  WatchlistCollection
} from '../types/watchlist.types';
import {ComponentStore} from '@ngrx/component-store';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import {WatchlistCollectionBrokerConfig} from './watchlist-collection-broker.types';
import {GuidGenerator} from '../../../common/utils/guid-generator';

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

@Injectable()
export class WatchlistCollectionBrokerService {
  readonly destroyRef = inject(DestroyRef);

  private readonly remoteStorageService = inject(RemoteStorageService);

  private readonly localStorageService = inject(LocalStorageService);

  private readonly applicationMetaService = inject(ApplicationMetaService);

  private readonly store = new WatchlistCollectionStore();

  private collection$: Observable<Watchlist[]> | null = null;

  private readonly groupKey = 'watchlist-collection';

  private readonly watchlistCollectionStorageKey = 'watchlistCollection';

  private readonly config$ = new BehaviorSubject<WatchlistCollectionBrokerConfig | null>(null);

  constructor() {
    const destroyRef = this.destroyRef;

    destroyRef.onDestroy(() => {
      this.store.ngOnDestroy();
      this.config$.complete();
    });
  }

  setConfig(config: WatchlistCollectionBrokerConfig): void {
    this.config$.next(config);
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
      this.getConfig().pipe(
        take(1)
      ).subscribe(config => {
        if (config.enableStore) {
          combineLatest([
            this.applicationMetaService.getMeta(),
            this.remoteStorageService.getGroup<Watchlist>(this.groupKey)
          ]).pipe(
            take(1)
          ).subscribe(([meta, records]) => {
            if (meta.lastResetTimestamp != null) {
              if (!!records && records.some(s => meta.lastResetTimestamp! > s.meta.timestamp)) {
                // clean settings after reset
                this.remoteStorageService.removeGroup(this.groupKey).pipe(
                  map(() => null),
                  take(1)
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
              if (localData) {
                const items = localData.collection.map(r => this.updateObsoleteWatchlist(r));

                this.store.patchState({
                  status: EntityStatus.Success,
                  collection: new Map<string, Watchlist>(items.map(r => [r.id, r]))
                });

                this.addOrUpdateLists(items).pipe(
                  take(1)
                ).subscribe(r => {
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
        } else {
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

    return this.getConfig().pipe(
      take(1),
      switchMap(config => {
        if (config.enableStore) {
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
        } else {
          return of(true);
        }
      })
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

    return this.getConfig().pipe(
      take(1),
      switchMap(config => {
        if (config.enableStore) {
          return this.remoteStorageService.removeRecord(id).pipe(
            take(1)
          );
        }

        return of(true);
      })
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

  private getConfig(): Observable<WatchlistCollectionBrokerConfig> {
    return this.config$.pipe(
      filter(c => c != null)
    );
  }
}
