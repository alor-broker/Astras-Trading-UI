import { ComponentStore } from '@ngrx/component-store';
import { Injectable } from '@angular/core';
import { MathHelper } from '../../../shared/utils/math-helper';
import { take } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PriceRow } from '../models/scalper-order-book.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { OrderBookScaleHelper } from "./order-book-scale.helper";

export interface PriceOptions {
  startPrice: number;
  expectedRangeMin: number;
  expectedRangeMax: number;
  scaledStep: number;
  basePriceStep: number;
  scaleFactor: number;
}

export interface PriceRowsState {
  instrumentKey: InstrumentKey | null;
  priceOptions: PriceOptions | null;
  directionRowsCount: number;
  rows: PriceRow[];
  // indicates that price range was generated without order book data
  isDirty: boolean;
}

const initialState: PriceRowsState = {
  instrumentKey: null,
  priceOptions: null,
  directionRowsCount: 100,
  rows: [],
  isDirty: true
};

@Injectable()
export class PriceRowsStore extends ComponentStore<PriceRowsState> {
  readonly state$ = this.select(state => state);

  constructor() {
    super(initialState);
  }

  extendTop(itemsToAdd: number, callback?: (addedItemsCount: number) => void): void {
    this.select(state => state).pipe(
      take(1),
      filter(s => s.priceOptions != null)
    ).subscribe(state => {
      const step = state.priceOptions!.scaledStep;
      const topRows = this.generatePriceSequence(state.rows[0].price + step, step, itemsToAdd)
        .reverse()
        .map(price => (
            {
              price: price,
              baseRange: OrderBookScaleHelper.scaledPriceToOriginal(price, state.priceOptions!.basePriceStep, state.priceOptions!.scaleFactor)
            } as PriceRow
          )
        );

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

  extendBottom(minItemsToAdd: number, callback?: (addedItemsCount: number) => void): void {
    this.select(state => state).pipe(
      take(1),
      filter(s => s.priceOptions != null)
    ).subscribe(state => {
      const step = state.priceOptions!.scaledStep;
      const lastElement = state.rows[state.rows.length - 1];

      const itemsToAdd = Math.max(state.directionRowsCount, minItemsToAdd);
      const bottomRows = this.generatePriceSequence(lastElement.price - step, -step, itemsToAdd)
        .map(price => (
            {
              price: price,
              baseRange: OrderBookScaleHelper.scaledPriceToOriginal(price, state.priceOptions!.basePriceStep, state.priceOptions!.scaleFactor)
            } as PriceRow
          )
        );

      this.patchState({
        rows: [
          ...state.rows,
          ...bottomRows
        ]
      });

      callback?.(itemsToAdd);
    });
  }

  public initWithPriceRange(
    instrumentKey: InstrumentKey,
    priceOptions: PriceOptions | null,
    isDirty: boolean,
    minRowsCount: number,
    complete?: () => void
  ): void {
    if(!!priceOptions) {
      const priceRowsCountByRange = Math.ceil((priceOptions.expectedRangeMax - priceOptions.expectedRangeMin) / priceOptions.scaledStep);

      const directionRowsCountMin = Math.ceil(minRowsCount / 2);

      const rowsCount = Math.ceil(Math.max(priceRowsCountByRange + 5, directionRowsCountMin));

      let topRows = this.generatePriceSequence(priceOptions.startPrice + priceOptions.scaledStep, priceOptions.scaledStep, rowsCount).reverse();
      const bottomRows = this.generatePriceSequence(priceOptions.startPrice - priceOptions.scaledStep, -priceOptions.scaledStep, rowsCount);

      const rows = [
        ...topRows,
        priceOptions.startPrice,
        ...bottomRows
      ].map(price => (
          {
            price: price,
            baseRange: OrderBookScaleHelper.scaledPriceToOriginal(price, priceOptions.basePriceStep, priceOptions.scaleFactor)
          } as PriceRow
        )
      );

      rows[rowsCount].isStartRow = true;

      this.setState({
        instrumentKey,
        priceOptions: priceOptions,
        directionRowsCount: rowsCount,
        rows: rows,
        isDirty
      });
    } else {
      this.setState({
        instrumentKey,
        priceOptions: null,
        directionRowsCount: 0,
        rows: [],
        isDirty: true
      });
    }

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
