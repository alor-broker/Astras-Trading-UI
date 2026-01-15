import { DestroyRef, Injectable, inject } from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, shareReplay, take} from "rxjs";
import {Graph} from "../models/graph.model";
import {RemoteStorageService} from "../../../shared/services/settings-broker/remote-storage.service";
import {EntityStatus} from "../../../shared/models/enums/entity-status";
import {ComponentStore} from "@ngrx/component-store";
import {ApplicationMetaService} from "../../../shared/services/application-meta.service";
import {filter, map} from "rxjs/operators";
import {LocalStorageService} from "../../../shared/services/local-storage.service";
import {LocalStorageCommonConstants} from "../../../shared/constants/local-storage.constants";

interface GraphStorageState {
  status: EntityStatus;
  graphs: Map<string, Graph>;
}

class GraphsCollectionStore extends ComponentStore<GraphStorageState> {
  constructor() {
    super({
      status: EntityStatus.Initial,
      graphs: new Map<string, Graph>()
    });
  }
}

export interface GraphStorageConfig {
  storageType: 'local' | 'remote';
}

@Injectable({
  providedIn: 'root'
})
export class GraphStorageService {
  private readonly remoteStorageService = inject(RemoteStorageService);
  private readonly applicationMetaService = inject(ApplicationMetaService);
  private readonly localStorageService = inject(LocalStorageService);
  readonly destroyRef = inject(DestroyRef);

  private readonly store = new GraphsCollectionStore();
  private readonly remoteStorageGroupKey = 'ai-graphs';
  private graphs$: Observable<Graph[]> | null = null;

  private readonly config$ = new BehaviorSubject<GraphStorageConfig | null>(null);

  constructor() {
    const destroyRef = this.destroyRef;

    destroyRef.onDestroy(() => {
      this.store.ngOnDestroy();
      this.config$.complete();
    });
  }

  setConfig(config: GraphStorageConfig): void {
    this.config$.next(config);
  }

  getAllGraphs(): Observable<Graph[]> {
    if (!this.graphs$) {
      this.graphs$ = this.store.state$.pipe(
        filter(s => s.status === EntityStatus.Success),
        map(s => {
            return Array.from(s.graphs.values())
              .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
          }
        ),
        shareReplay(1)
      );

      this.store.patchState({
        status: EntityStatus.Loading,
      });

      this.getConfig().pipe(
        take(1)
      ).subscribe(config => {
        if (config.storageType === "local") {
          this.loadLocalStorageState();
        } else {
          this.loadRemoteStorageState();
        }
      });
    }

    return this.graphs$;
  }

  addUpdateGraph(graph: Graph): void {
    this.store.patchState(state => {
      const newCollection = new Map(state.graphs);
      newCollection.set(graph.id, graph);
      return {
        graphs: newCollection
      };
    });

    this.getConfig().pipe(
      take(1)
    ).subscribe(config => {
      if (config.storageType === "local") {
        this.saveLocalStorageState();
      } else {
        this.updateRemoteStorageGraphState(graph);
      }
    });
  }

  removeGraph(id: string): void {
    let needUpdate = false;
    this.store.patchState(state => {
      const newCollection = new Map(state.graphs);
      needUpdate = newCollection.delete(id);
      return {
        graphs: newCollection
      };
    });

    if (needUpdate) {
      this.getConfig().pipe(
        take(1)
      ).subscribe(config => {
        if (config.storageType === "local") {
          this.saveLocalStorageState();
        } else {
          this.remoteStorageService.removeRecord(id).subscribe();
        }
      });
    }
  }

  private getConfig(): Observable<GraphStorageConfig> {
    return this.config$.pipe(
      filter(c => c != null)
    );
  }

  private loadLocalStorageState(): void {
    const graphs = this.localStorageService.getItem<Graph[]>(LocalStorageCommonConstants.AIGraphsStorageKey);
    this.store.patchState({
      status: EntityStatus.Success,
      graphs: new Map<string, Graph>((graphs ?? []).map(g => [g.id, g]))
    });
  }

  private loadRemoteStorageState(): void {
    combineLatest([
      this.applicationMetaService.getMeta(),
      this.remoteStorageService.getGroup(this.remoteStorageGroupKey)
    ]).pipe(
      take(1)
    ).subscribe(([meta, records]) => {
      if (meta.lastResetTimestamp != null) {
        if (!!records && records.some(s => meta.lastResetTimestamp! > s.meta.timestamp)) {
          // clean records after reset
          this.remoteStorageService.removeGroup(this.remoteStorageGroupKey).pipe(
            map(() => null)
          ).subscribe(() => {
            this.store.patchState({
              status: EntityStatus.Success,
              graphs: new Map<string, Graph>()
            });
          });

          return;
        }
      }

      this.store.patchState({
        status: EntityStatus.Success,
        graphs: new Map<string, Graph>((records ?? []).map(r => [r.value.id, r.value]))
      });
    });
  }

  private saveLocalStorageState(): void {
    this.store.state$.pipe(
      map(s => Array.from(s.graphs.values())),
      take(1)
    ).subscribe(graphs => {
      this.localStorageService.setItem(LocalStorageCommonConstants.AIGraphsStorageKey, graphs);
    });
  }

  private updateRemoteStorageGraphState(graph: Graph): void {
    this.remoteStorageService.setRecord(
      {
        key: graph.id,
        meta: {
          timestamp: this.getTimestamp()
        },
        value: graph
      }
    ).subscribe();
  }

  private getTimestamp(): number {
    return Date.now();
  }
}
