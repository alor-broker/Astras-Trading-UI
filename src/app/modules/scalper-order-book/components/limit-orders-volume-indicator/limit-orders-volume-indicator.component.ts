import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { Side } from "../../../../shared/models/enums/side.model";
import { ScalperOrderBookDataContext } from "../../models/scalper-order-book-data-context.model";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { OrderType } from "../../../../shared/models/orders/order.model";

@Component({
  selector: 'ats-limit-orders-volume-indicator',
  templateUrl: './limit-orders-volume-indicator.component.html',
  styleUrls: ['./limit-orders-volume-indicator.component.less']
})
export class LimitOrdersVolumeIndicatorComponent implements OnInit {
  readonly sides = Side;
  @Input({ required: true })
  side!: Side;
  @Input({ required: true })
  dataContext!: ScalperOrderBookDataContext;

  ordersVolume$!: Observable<number>;

  ngOnInit(): void {
    this.ordersVolume$ = this.dataContext.currentOrders$.pipe(
      map(orders => orders.filter(o => o.type === OrderType.Limit && o.side === this.side)),
      map(orders => orders.reduce((acc, curr) => acc + curr.displayVolume, 0))
    );
  }
}
