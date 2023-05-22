import { ComponentStore } from '@ngrx/component-store';
import { Injectable } from '@angular/core';
import { MathHelper } from '../../../shared/utils/math-helper';
import { take } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PriceRow } from '../models/scalper-order-book.model';
import { Range } from '../../../shared/models/common.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';

export interface PriceRowsState {
  instrumentKey: InstrumentKey | null;
  rowStep: number | null;
  directionRowsCount: number;
  rows: PriceRow[];
}

const initialState: PriceRowsState = {
  instrumentKey: null,
  rowStep: null,
  directionRowsCount: 100,
  rows: []
};

@Injectable()
export class PriceRowsStore extends ComponentStore<PriceRowsState> {
  readonly state$ = this.select(state => state);

  constructor() {
    super(initialState);
  }

  resetState() {
    this.patchState(initialState);
  }

  extendTop(itemsToAdd: number, callback?: (addedItemsCount: number) => void) {
    this.select(state => state).pipe(
      take(1),
      filter(s => !!s.rowStep)
    ).subscribe(state => {
      const step = state.rowStep!;
      const topRows = this.generatePriceSequence(state.rows[0].price + step, step, itemsToAdd)
        .reverse()
        .map(price => ({ price: price } as PriceRow));

      this.patchState({
        rows: [
          ...topRows,
          ...state.rows
        ]
      });

      if (callback) {
        callback(itemsToAdd);
      }
    });
  }

  extendBottom(minItemsToAdd: number, callback?: (addedItemsCount: number) => void) {
    this.select(state => state).pipe(
      take(1),
      filter(s => !!s.rowStep)
    ).subscribe(state => {
      const step = state.rowStep!;
      const lastElement = state.rows[state.rows.length - 1];

      const itemsToAdd = Math.max(state.directionRowsCount, minItemsToAdd);
      const bottomRows = this.generatePriceSequence(lastElement.price - step, -step, itemsToAdd)
        .map(price => ({ price: price } as PriceRow));

      this.patchState({
        rows: [
          ...state.rows,
          ...bottomRows
        ]
      });

      callback?.(itemsToAdd);
    });
  }

  public initWithPriceRange(instrumentKey: InstrumentKey, priceRange: Range, step: number, renderRowsCount: number, complete?: () => void) {
    const priceRowsCount = Math.ceil((priceRange.max - priceRange.min) / step);
    const startPrice = MathHelper.round(
      priceRange.min + Math.ceil(priceRowsCount / 2) * step,
      MathHelper.getPrecision(step)
    );

    const oneDirectionRowsCount = Math.ceil(renderRowsCount / 2);

    const rowsCount = Math.ceil(Math.max(priceRowsCount + 5, oneDirectionRowsCount));

    let topRows = this.generatePriceSequence(startPrice + step, step, rowsCount).reverse();
    const bottomRows = this.generatePriceSequence(startPrice - step, -step, rowsCount);

    if((topRows.length + bottomRows.length) < renderRowsCount) {
      topRows = this.generatePriceSequence(startPrice + step, step, rowsCount * 2,).reverse();
    }

    const rows = [
      ...topRows,
      startPrice,
      ...bottomRows
    ].map(price => ({ price: price } as PriceRow));

    rows[rowsCount].isStartRow = true;

    this.setState({
      instrumentKey,
      rowStep: step,
      directionRowsCount: rowsCount,
      rows: rows
    });

    if (complete) {
      complete();
    }
  }

  private generatePriceSequence(start: number, step: number, count: number): number[] {
    const pricePrecision = MathHelper.getPrecision(step);
    return [...Array(count).keys()]
      .map(i => start + (i * step))
      .map(x => MathHelper.round(x, pricePrecision));
  }
}
