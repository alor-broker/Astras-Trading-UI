import {
  createEntityAdapter,
  EntityState
} from "@ngrx/entity";
import { WatchlistItem } from "../models/watchlist.model";
import {
  Observable,
  Subscription
} from "rxjs";
import { ComponentStore } from "@ngrx/component-store";

interface InstrumentToWatch {
  recordId: string;
  watchItem: WatchlistItem;
  updatesSubscription: Subscription | null;
  onItemRemove: (() => void);
}

class InstrumentsToWatchStore extends ComponentStore<EntityState<InstrumentToWatch>> {
  readonly adapter = createEntityAdapter<InstrumentToWatch>({
    selectId: model => model.recordId
  });

  readonly selectors = this.adapter.getSelectors();

  constructor() {
    super();
    this.setState(this.adapter.getInitialState());
  }
}

export class InstrumentsToWatchManager {
  private readonly store = new InstrumentsToWatchStore();
  private isDestroyed = false;

  addItem(watchItem: WatchlistItem, onItemRemove: () => void): void {
    if (this.isDestroyed) {
      return;
    }

    this.store.patchState(state => {
      return this.store.adapter.addOne(
        {
          recordId: watchItem.recordId!,
          watchItem,
          updatesSubscription: null,
          onItemRemove: onItemRemove ?? null
        }
        , state);
    });
  }

  getCurrentItemIds(): Observable<string[]> {
    return this.store.select(
      state => {
        return this.store.selectors.selectIds(state) as string[];
      }
    );
  }

  setUpdatesSubscription(recordId: string, subscription: Subscription): void {
    if (this.isDestroyed) {
      subscription.unsubscribe();
      return;
    }

    this.store.patchState(state => {
      const item = state.entities[recordId];
      if (item != null) {
        item.updatesSubscription?.unsubscribe();
        return this.store.adapter.updateOne({
            id: item.recordId,
            changes: {
              updatesSubscription: subscription
            }
          },
          state
        );
      }

      return state;
    });
  }

  removeItem(recordId: string): void {
    if (this.isDestroyed) {
      return;
    }

    this.store.patchState(state => {
      const item = state.entities[recordId];
      if (item != null) {
        this.onItemRemove(item);
        return this.store.adapter.removeOne(recordId, state);
      }

      return state;
    });
  }

  destroy(): void {
    this.isDestroyed = true;
    const state = this.store.state();
    if (state != null) {
      for (const id of state.ids as string[]) {
        this.onItemRemove(state.entities[id]!);
      }
    }

    this.store.ngOnDestroy();
  }

  private onItemRemove(item: InstrumentToWatch): void {
    item.updatesSubscription?.unsubscribe();
    item.onItemRemove();
  }
}
