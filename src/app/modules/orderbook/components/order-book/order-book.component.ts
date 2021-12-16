import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';

import { DashboardItem } from '../../../../shared/models/dashboard-item.model';
import { OrderbookService } from '../../services/orderbook.service';
import { OrderBook } from '../../models/orderbook.model';

type Widget = OnInit & DashboardItem;

interface Size {
  width: string,
  height: string
}

@Component({
  selector: 'ats-order-book[widget][resize][shouldShowSettings]',
  templateUrl: './order-book.component.html',
  styleUrls: ['./order-book.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [OrderbookService]
})
export class OrderBookComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: DashboardItem;
  @Input()
  resize!: EventEmitter<DashboardItem>;

  resizeSub!: Subscription;
  ob$: Observable<OrderBook | null> = of(null);
  maxVolume: number = 1;

  sizes: BehaviorSubject<Size> = new BehaviorSubject<Size>({width: '100%', height: '100%'});

  constructor(private service: OrderbookService) {
    this.ob$ = this.service.orderBook$;
    this.ob$.subscribe(ob => this.maxVolume = ob?.maxVolume ?? 1);
  }

  ngOnInit(): void {
    this.resizeSub = this.resize.subscribe((widget) => {
      if (widget.item === this.widget.item) {
        // or check id , type or whatever you have there
        // resize your widget, chart, map , etc.
        this.sizes.next({
          // width: (widget.width ?? 0) + 'px',
          width: (widget.width ?? 0) + 'px',
          height: (widget.height ?? 0) + 'px'
        })
        // console.log(widget);
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeSub.unsubscribe();
  }

  getBidStyle(value: number) {
    const size = 100 * (value / this.maxVolume);
    return { background: `linear-gradient(90deg, white ${size}%, green ${1 - size}%)`};
  }
  getAskStyle(value: number) {
    const size = 100 * (value / this.maxVolume);
    return { background: `linear-gradient(90deg, red ${size}%, white ${1 - size}%)`};
  }
}
