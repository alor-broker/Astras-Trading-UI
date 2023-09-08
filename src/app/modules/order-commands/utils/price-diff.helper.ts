import {combineLatest, Observable} from "rxjs";
import {Position} from "../../../shared/models/positions/position.model";
import {map} from "rxjs/operators";
import {MathHelper} from "../../../shared/utils/math-helper";

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
}
