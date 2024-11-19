import {
  createEntityAdapter,
  EntityState
} from "@ngrx/entity";
import { shareReplay, } from "rxjs";
import { WatchedInstrument } from "../models/watched-instrument.model";
import { ComponentStore } from "@ngrx/component-store";

class WatchlistUpdatesStore extends ComponentStore<EntityState<WatchedInstrument>> {
  readonly adapter = createEntityAdapter<WatchedInstrument>({
    selectId: model => model.recordId
  });

  readonly selectors = this.adapter.getSelectors();

  constructor() {
    super();
    this.setState(this.adapter.getInitialState());
  }
}

export class WatchlistUpdatesManager {
  private isDestroyed = false;
  private readonly store = new WatchlistUpdatesStore();

  updates$ = this.store.select(this.store.selectors.selectAll).pipe(
    shareReplay(1)
  );

  addItem(item: WatchedInstrument): void {
    if (this.isDestroyed) {
      return;
    }

    this.store.patchState(state => this.store.adapter.addOne(item, state));
  }

  updateItem(recordId: string, update: Partial<Omit<WatchedInstrument, 'recordId'>>): void {
    if (this.isDestroyed) {
      return;
    }

    this.store.patchState(state => {
      return this.store.adapter.updateOne({
          id: recordId,
          changes: update
        },
        state
      );
    });
  }

  removeItem(recordId: string): void {
    if (this.isDestroyed) {
      return;
    }

    this.store.patchState(state => this.store.adapter.removeOne(recordId, state));
  }

  destroy(): void {
    this.isDestroyed = true;
    this.store.ngOnDestroy();
  }
}
