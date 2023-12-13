import {
  createEntityAdapter,
  EntityState
} from "@ngrx/entity";
import { WatchlistItem } from "../models/watchlist.model";
import { Subscription } from "rxjs";

interface InstrumentToWatch {
  recordId: string;
  watchItem: WatchlistItem;
  updatesSubscription: Subscription | null;
  onItemRemove: (() => void) | null;
}

export class InstrumentsToWatchState {
  readonly adapter = createEntityAdapter<InstrumentToWatch>({
    selectId: model => model.recordId
  });

  private state = this.adapter.getInitialState();

  addItem(watchItem: WatchlistItem, onItemRemove?: () => void): void {
    this.updateState(state => {
      return this.adapter.addOne(
        {
          recordId: watchItem.recordId!,
          watchItem,
          updatesSubscription: null,
          onItemRemove: onItemRemove ?? null
        }
        , state);
    });
  }

  getInstrument(recordId: string): WatchlistItem | null {
    return this.getItemById(recordId)?.watchItem ?? null;
  }

  getCurrentItemIds(): string[] {
    return this.adapter.getSelectors().selectIds(this.state) as string[];
  }

  setUpdatesSubscription(recordId: string, subscription: Subscription): void {
    const item = this.getItemById(recordId);
    if (!!item) {
      item.updatesSubscription?.unsubscribe();

      this.updateState(state => {
        return this.adapter.updateOne({
            id: item.recordId,
            changes: {
              updatesSubscription: subscription
            }
          },
          state
        );
      });
    }
  }

  removeItem(recordId: string): void {
    const item = this.getItemById(recordId);
    if (!!item) {
      this.onItemRemove(item);

      this.updateState(state => this.adapter.removeOne(item.recordId, state));
    }
  }

  removeAll(): void {
    this.adapter.getSelectors().selectAll(this.state).forEach(item => {
      this.onItemRemove(item);
    });

    this.updateState(state => this.adapter.removeAll(state));
  }

  private onItemRemove(item: InstrumentToWatch): void {
    item.updatesSubscription?.unsubscribe();
    item.onItemRemove?.();
  }

  private getItemById(recordId: string): InstrumentToWatch | null {
    return this.adapter.getSelectors().selectEntities(this.state)[recordId] ?? null;
  }

  private updateState(update: (state: EntityState<InstrumentToWatch>) => EntityState<InstrumentToWatch>): void {
    this.state = update(this.state);
  }
}
