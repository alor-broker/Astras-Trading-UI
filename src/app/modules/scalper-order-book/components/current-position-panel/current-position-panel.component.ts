import { Component, OnDestroy, OnInit, input, inject } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  take
} from 'rxjs';
import { map } from 'rxjs/operators';
import { MathHelper } from '../../../../shared/utils/math-helper';
import { ScalperOrderBookPositionState } from '../../models/scalper-order-book.model';
import { ScalperOrderBookDataProvider } from '../../services/scalper-order-book-data-provider.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { LetDirective } from '@ngrx/component';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { NgClass, DecimalPipe } from '@angular/common';

@Component({
    selector: 'ats-current-position-panel',
    templateUrl: './current-position-panel.component.html',
    styleUrls: ['./current-position-panel.component.less'],
    imports: [
      TranslocoDirective,
      LetDirective,
      NzTooltipDirective,
      NgClass,
      DecimalPipe
    ]
})
export class CurrentPositionPanelComponent implements OnInit, OnDestroy {
  private readonly dataContextService = inject(ScalperOrderBookDataProvider);

  readonly guid = input.required<string>();

  readonly hideTooltips = input(false);

  orderBookPosition$!: Observable<ScalperOrderBookPositionState>;

  lossOrProfitDisplayType$ = new BehaviorSubject<'points' | 'percentage'>('points');

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

        if(position != null && position.qtyTFutureBatch !== 0) {
          const minStepDigitsAfterPoint = MathHelper.getPrecision(settings.instrument.minstep);
          state.qty = position.qtyTFutureBatch;
          state.price = MathHelper.round(position.avgPrice, minStepDigitsAfterPoint);

          const sign = position!.qtyTFuture > 0 ? 1 : -1;

          const bestPrice = sign > 0
            ? orderBook.rows.b[0]?.p ?? orderBook.rows.a[0]?.p
            : orderBook.rows.a[0]?.p ?? orderBook.rows.b[0]?.p;

          if(bestPrice != null) {
            state.lossOrProfitPoints = Math.round((bestPrice - position!.avgPrice) / settings.instrument.minstep) * sign;
            state.lossOrProfitPercent = MathHelper.round(((bestPrice - position!.avgPrice) / position!.avgPrice) * 100 * sign, 3);
          }
        }

        return state;
      })
    );
  }
}
