import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  take
} from 'rxjs';
import { map } from 'rxjs/operators';
import { MathHelper } from '../../../../shared/utils/math-helper';
import { ScalperOrderBookPositionState } from '../../models/scalper-order-book.model';
import { ScalperOrderBookDataContextService } from '../../services/scalper-order-book-data-context.service';

@Component({
  selector: 'ats-current-position-panel',
  templateUrl: './current-position-panel.component.html',
  styleUrls: ['./current-position-panel.component.less']
})
export class CurrentPositionPanelComponent implements OnInit, OnDestroy {
  @Input({required: true})
  guid!: string;

  orderBookPosition$!: Observable<ScalperOrderBookPositionState | null>;

  lossOrProfitDisplayType$ = new BehaviorSubject<'points' | 'percentage'>('points');

  constructor(private readonly dataContextService: ScalperOrderBookDataContextService) {
  }

  changeLossOrProfitDisplayType(): void {
    this.lossOrProfitDisplayType$.pipe(
      take(1)
    ).subscribe(currentType => {
      this.lossOrProfitDisplayType$.next(currentType === 'points' ? 'percentage' : 'points');
    });
  }

  ngOnInit(): void {
    this.orderBookPosition$ = this.getPositionStateStream();
  }

  ngOnDestroy(): void {
    this.lossOrProfitDisplayType$.complete();
  }

  private getPositionStateStream(): Observable<ScalperOrderBookPositionState | null> {
    const settings$ = this.dataContextService.getSettingsStream(this.guid);

    return combineLatest([
      settings$,
      this.dataContextService.getOrderBookStream(settings$),
      this.dataContextService.getOrderBookPositionStream(settings$, this.dataContextService.getOrderBookPortfolio())
    ]).pipe(
      map(([settings, orderBook, position]) => {
        if (!position || position.qtyTFuture === 0 || orderBook.rows.a.length === 0 || orderBook.rows.b.length === 0) {
          return null;
        }

        const sign = position!.qtyTFuture > 0 ? 1 : -1;
        const bestPrice = sign > 0
          ? orderBook.rows.b[0].p
          : orderBook.rows.a[0].p;

        const rowsDifference = Math.round((bestPrice - position!.avgPrice) / settings.instrument.minstep) * sign;
        const rowsDifferencePercent = MathHelper.round(((bestPrice - position!.avgPrice) / position!.avgPrice) * 100 * sign, 3);

        const minStepDigitsAfterPoint = MathHelper.getPrecision(settings.instrument.minstep);

        return {
          qty: position!.qtyTFutureBatch,
          price: MathHelper.round(position!.avgPrice, minStepDigitsAfterPoint),
          lossOrProfitPoints: rowsDifference,
          lossOrProfitPercent: rowsDifferencePercent
        };
      })
    );
  }
}
