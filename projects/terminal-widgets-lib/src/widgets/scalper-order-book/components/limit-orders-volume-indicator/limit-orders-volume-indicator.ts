import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {DecimalPipe} from '@angular/common';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {ScalperOrderBookDataContext} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book-data-context.types';
import {OrderType} from '@terminal-core-lib/features/orders/types/orders.types';

@Component({
  selector: 'ats-limit-orders-volume-indicator',
  templateUrl: './limit-orders-volume-indicator.html',
  styleUrls: ['./limit-orders-volume-indicator.less'],
  imports: [
    TranslocoDirective,
    LetDirective,
    NzTooltipDirective,
    DecimalPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LimitOrdersVolumeIndicator implements OnInit {
  readonly side = input.required<Side>();

  readonly dataContext = input.required<ScalperOrderBookDataContext>();

  readonly hideTooltips = input(false);

  ordersVolume$!: Observable<number>;

  ngOnInit(): void {
    this.ordersVolume$ = this.dataContext().currentOrders$.pipe(
      map(orders => orders.filter(o => o.type === OrderType.Limit && o.side === this.side())),
      map(orders => orders.reduce((acc, curr) => acc + curr.displayVolume, 0))
    );
  }
}
