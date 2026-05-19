import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  take
} from 'rxjs';
import {map} from 'rxjs/operators';
import {ScalperOrderBookDataProvider} from '../../services/scalper-order-book-data-provider.service';
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {DecimalPipe} from '@angular/common';
import {ScalperOrderBookPositionState} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';

@Component({
  selector: 'ats-current-position-panel',
  templateUrl: './current-position-panel.html',
  styleUrls: ['./current-position-panel.less'],
  imports: [
    TranslocoDirective,
    LetDirective,
    NzTooltipDirective,
    DecimalPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CurrentPositionPanel implements OnInit, OnDestroy {
  readonly guid = input.required<string>();

  readonly hideTooltips = input(false);

  orderBookPosition$!: Observable<ScalperOrderBookPositionState>;

  lossOrProfitDisplayType$ = new BehaviorSubject<'points' | 'percentage'>('points');

  private readonly dataContextService = inject(ScalperOrderBookDataProvider);

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

  private getPositionStateStream(): Observable<ScalperOrderBookPositionState> {
    const settings$ = this.dataContextService.getSettingsStream(this.guid());

    return combineLatest([
      settings$,
      this.dataContextService.getOrderBookStream(settings$),
      this.dataContextService.getOrderBookPositionStream(settings$, this.dataContextService.getOrderBookPortfolio())
    ]).pipe(
      map(([settings, orderBook, position]) => {
        const state: ScalperOrderBookPositionState = {
          qty: 0
        };

        if (position != null && position.qtyTFutureBatch !== 0) {
          const minStepDigitsAfterPoint = MathHelper.getPrecision(settings.instrument.minstep);
          state.qty = position.qtyTFutureBatch;
          state.price = MathHelper.round(position.avgPrice, minStepDigitsAfterPoint);

          const sign = position!.qtyTFuture > 0 ? 1 : -1;

          const bestPrice = sign > 0
            ? orderBook.rows.b[0]?.p ?? orderBook.rows.a[0]?.p
            : orderBook.rows.a[0]?.p ?? orderBook.rows.b[0]?.p;

          if (bestPrice != null) {
            state.lossOrProfitPoints = Math.round((bestPrice - position!.avgPrice) / settings.instrument.minstep) * sign;
            state.lossOrProfitPercent = MathHelper.round(((bestPrice - position!.avgPrice) / position!.avgPrice) * 100 * sign, 3);
          }
        }

        return state;
      })
    );
  }
}
