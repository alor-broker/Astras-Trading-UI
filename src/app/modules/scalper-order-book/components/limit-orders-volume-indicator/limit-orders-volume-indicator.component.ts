import {Component, input, OnInit} from '@angular/core';
import {Side} from "../../../../shared/models/enums/side.model";
import {ScalperOrderBookDataContext} from "../../models/scalper-order-book-data-context.model";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {OrderType} from "../../../../shared/models/orders/order.model";
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'ats-limit-orders-volume-indicator',
  templateUrl: './limit-orders-volume-indicator.component.html',
  styleUrls: ['./limit-orders-volume-indicator.component.less'],
  imports: [
    TranslocoDirective,
    LetDirective,
    NzTooltipDirective,
    DecimalPipe
  ]
})
export class LimitOrdersVolumeIndicatorComponent implements OnInit {
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
