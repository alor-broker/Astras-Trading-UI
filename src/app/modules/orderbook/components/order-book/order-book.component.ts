import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';

import { DashboardItem } from '../../../../shared/models/dashboard-item.model';
import { OrderbookService } from '../../services/orderbook.service';
import { OrderBook } from '../../models/orderbook.model';
import { OrderbookSettings } from '../../../../shared/models/settings/orderbook-settings.model';
import {
  switchMap,
  tap,
} from 'rxjs/operators';
import { Widget } from 'src/app/shared/models/widget.model';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { SyncService } from 'src/app/shared/services/sync.service';
import { Side } from 'src/app/shared/models/enums/side.model';

interface Size {
  width: string;
  height: string;
}

@Component({
  selector: 'ats-order-book[widget][resize][shouldShowSettings][settings]',
  templateUrl: './order-book.component.html',
  styleUrls: ['./order-book.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class OrderBookComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<OrderbookSettings>;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Input('settings') set settings(settings: OrderbookSettings) { this.settings$.next(settings); };
  private settings$ = new BehaviorSubject<OrderbookSettings>({
    symbol: 'SBER',
    exchange: 'MOEX'
  });
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  resizeSub!: Subscription;
  ob$: Observable<OrderBook | null> = of(null);
  maxVolume: number = 1;

  sizes: BehaviorSubject<Size> = new BehaviorSubject<Size>({
    width: '100%',
    height: '100%',
  });

  constructor(private service: OrderbookService, private sync: SyncService) {

  }

  ngOnInit(): void {
    this.ob$ = this.settings$.pipe(
      switchMap(s => this.service.getOrderbook(s.symbol, s.exchange, s.instrumentGroup, s.depth)),
      tap(ob => this.maxVolume = ob?.maxVolume ?? 1)
    )
    this.resizeSub = this.resize.subscribe((widget) => {
      if (widget.item === this.widget.gridItem) {
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
    this.service.unsubscribe();
    this.resizeSub.unsubscribe();
  }

  getBidStyle(value: number) {
    const size = 100 * (value / this.maxVolume);
    return {
      background: `linear-gradient(270deg,  lightgreen ${size}% ,white ${size}%)`,
    };
  }

  getAskStyle(value: number) {
    const size = 100 * (value / this.maxVolume);
    return {
      background: `linear-gradient(90deg, pink ${size}%, white ${size}%)`,
    };
  }

  newLimitOrder(side: string, price: number) {
    const params: CommandParams = {
      instrument: { ...this.settings$.getValue() },
      side: side == 'buy' ? Side.Buy : Side.Sell,
      price
    }
    this.sync.openCommandModal(params);
  }
}
