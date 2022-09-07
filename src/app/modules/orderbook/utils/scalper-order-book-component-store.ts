import { ScalperOrderBookRow } from '../models/scalper-order-book.model';
import { ComponentStore } from '@ngrx/component-store';
import { Injectable } from '@angular/core';
import { MathHelper } from '../../../shared/utils/math-helper';
import { take } from 'rxjs';
import { filter } from 'rxjs/operators';

interface ScalperOrderBookState {
  rowStep: number | null;
  directionRowsCount: number;
  rows: ScalperOrderBookRow[];
}

const initialState: ScalperOrderBookState = {
  rowStep: null,
  directionRowsCount: 100,
  rows: []
};

@Injectable()
export class ScalperOrderBookComponentStore extends ComponentStore<ScalperOrderBookState> {
  readonly rows$ = this.select(state => state.rows);

  constructor() {
    super(initialState);
  }

  resetState() {
    this.patchState(initialState);
  }

  setInitialRange(startPrice: number, step: number, directionRowsCount: number, complete?: () => void) {
    const rows = [
      ...this.generatePriceSequence(startPrice + step, step, directionRowsCount).reverse(),
      startPrice,
      ...this.generatePriceSequence(startPrice - step, -step, directionRowsCount)
    ].map(price => ({ price: price } as ScalperOrderBookRow));

    rows[directionRowsCount].isStartRow = true;

    this.setState({
      rowStep: step,
      directionRowsCount: directionRowsCount,
      rows: rows
    });

    if (complete) {
      complete();
    }
  }

  regenerateForPrice(minPrice: number, maxPrice: number, complete?: () => void) {
    this.select(state => state).pipe(
      take(1),
      filter(s => !!s.rowStep)
    ).subscribe(state => {
      this.resetState();

      const step = state.rowStep!;
      const pricePrecision = MathHelper.getPrecision(state.rowStep!);
      const newRowsCount = Math.ceil((maxPrice - minPrice) / step) + 10;
      const newPrice = minPrice + Math.ceil(((maxPrice - minPrice) / step) / 2) * step;

      this.setInitialRange(MathHelper.round(newPrice, pricePrecision), step, Math.max(newRowsCount, state.directionRowsCount), complete);
    });
  }

  extendTop(callback?: (addedItemsCount: number) => void) {
    this.select(state => state).pipe(
      take(1),
      filter(s => !!s.rowStep)
    ).subscribe(state => {
      const step = state.rowStep!;
      const topRows = this.generatePriceSequence(state.rows[0].price + step, step, state.directionRowsCount)
        .reverse()
        .map(price => ({ price: price } as ScalperOrderBookRow));

      this.patchState({
        rows: [
          ...topRows,
          ...state.rows
        ]
      });

      if (callback) {
        callback(state.directionRowsCount);
      }
    });
  }

  extendBottom(callback?: (addedItemsCount: number) => void) {
    this.select(state => state).pipe(
      take(1),
      filter(s => !!s.rowStep)
    ).subscribe(state => {
      const step = state.rowStep!;
      const lastElement = state.rows[state.rows.length - 1];
      if (lastElement.price <= 0) {
        return;
      }

      const bottomRows = this.generatePriceSequence(lastElement.price - step, -step, state.directionRowsCount)
        .filter(price => price > 0)
        .map(price => ({ price: price } as ScalperOrderBookRow));

      this.patchState({
        rows: [
          ...state.rows,
          ...bottomRows
        ]
      });

      if (callback) {
        callback(state.directionRowsCount);
      }
    });
  }

  private generatePriceSequence(start: number, step: number, count: number): number[] {
    const pricePrecision = MathHelper.getPrecision(step);
    return [...Array(count).keys()]
      .map(i => start + (i * step))
      .map(x => MathHelper.round(x, pricePrecision))
      .filter(x => x > 0);
  }
}
