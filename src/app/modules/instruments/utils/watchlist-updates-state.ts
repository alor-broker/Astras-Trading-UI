import {
  createEntityAdapter,
  EntityState
} from "@ngrx/entity";
import {
  BehaviorSubject,
  shareReplay,
  take
} from "rxjs";
import { map } from "rxjs/operators";
import { WatchedInstrument } from "../models/watched-instrument.model";

export class WatchlistUpdatesState {
  readonly adapter = createEntityAdapter<WatchedInstrument>({
    selectId: model => model.recordId
  });

  private readonly state$ = new BehaviorSubject(this.adapter.getInitialState());

  updates$ = this.state$.pipe(
    map(state => this.adapter.getSelectors().selectAll(state)),
    shareReplay(1)
  );

  addItem(item: WatchedInstrument): void {
    this.updateState(state => this.adapter.addOne(item, state));
  }

  updateItem(recordId: string, update: Partial<Omit<WatchedInstrument, 'recordId' | 'instrument' | 'addTime'>>): void {
    this.updateState(state => {
      return this.adapter.updateOne(
        {
          id: recordId,
          changes: update
        },
        state
      );
    });
  }

  removeItem(recordId: string): void {
    this.updateState(state => this.adapter.removeOne(recordId, state));
  }

  removeAll(): void {
    this.updateState(state => this.adapter.removeAll(state));
  }

  destroy(): void {
    this.state$.complete();
  }

  private updateState(update: (state: EntityState<WatchedInstrument>) => EntityState<WatchedInstrument>): void {
    this.state$.pipe(
      take(1)
    ).subscribe(state => {
      this.state$.next(update(state));
    });
  }
}
