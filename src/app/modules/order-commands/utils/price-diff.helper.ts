import {
  combineLatest,
  defer,
  distinctUntilChanged,
  Observable,
  switchMap
} from "rxjs";
import { Position } from "../../../shared/models/positions/position.model";
import {
  map,
  startWith
} from "rxjs/operators";
import { MathHelper } from "../../../shared/utils/math-helper";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { PortfolioSubscriptionsService } from "../../../shared/services/portfolio-subscriptions.service";
import { FormControl } from "@angular/forms";

export class PriceDiffHelper {
  static getPositionDiff(
    price$: Observable<number | null | undefined>,
    position$: Observable<Position | null>
  ): Observable<{ percent: number, sign: number } | null> {
    return combineLatest({
      price: price$,
      position: position$
    }).pipe(
      map(x => {
        if (x.price == null || !x.position || !x.position.avgPrice) {
          return null;
        }

        const percent = MathHelper.round(((x.price / x.position.avgPrice) - 1) * 100, 3);
        return {
          percent: Math.abs(percent),
          sign: percent >= 0 ? 1 : -1
        };
      })
    );
  }

  static getPriceDiffCalculation(
    priceControl: FormControl<number | null>,
    instrument$: Observable<{ instrument: InstrumentKey, portfolioKey: PortfolioKey }>,
    portfolioSubscriptionsService: PortfolioSubscriptionsService
  ): Observable<{ percent: number, sign: number } | null> {
    // use defer to get actual first value for price control when subscription is requested
    // resolves  p.1 of issue #1205
    const priceChanges$ = defer(() => {
      return priceControl.valueChanges.pipe(
        startWith(priceControl.value),
        distinctUntilChanged((prev, curr) => prev === curr)
      );
    });

    return instrument$.pipe(
      switchMap(x => PriceDiffHelper.getPositionDiff(
        priceChanges$,
        portfolioSubscriptionsService.getInstrumentPositionSubscription(x.portfolioKey!, x.instrument!)
      ))
    );
  }
}
