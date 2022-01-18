import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { BehaviorSubject, merge, Observable, of, Subscription, zip } from 'rxjs';

import { DashboardItem } from '../../../../shared/models/dashboard-item.model';
import { OrderbookService } from '../../services/orderbook.service';
import { OrderBook } from '../../models/orderbook.model';
import { OrderbookSettings } from '../../../../shared/models/settings/orderbook-settings.model';
import {
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { Widget } from 'src/app/shared/models/widget.model';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { SyncService } from 'src/app/shared/services/sync.service';
import { Side } from 'src/app/shared/models/enums/side.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { sellColorBackground, buyColorBackground } from '../../../../shared/models/settings/styles-constants'

interface Size {
  width: string;
  height: string;
}

@Component({
  selector: 'ats-order-book[widget][resize][shouldShowSettings][settings]',
  templateUrl: './order-book.component.html',
  styleUrls: ['./order-book.component.sass'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
  // encapsulation: ViewEncapsulation.None,
})
export class OrderBookComponent implements OnInit, OnChanges {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<OrderbookSettings>;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Input('settings') set settings(settings: OrderbookSettings) { this.settings$.next(settings); };
  private settings$ = new BehaviorSubject<OrderbookSettings>({
    symbol: 'SBER',
    exchange: 'MOEX',
    linkToActive: true
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

  private instrumentSub!: Subscription

  constructor(private service: OrderbookService, private sync: SyncService) {

  }
  ngOnChanges(changes: SimpleChanges): void {

  }

  ngOnInit(): void {
    this.instrumentSub = this.sync.selectedInstrument$.subscribe(i => {
      const current = this.settings$.getValue();
      if (current.linkToActive && !(current.symbol != i.symbol ||
          current.exchange != i.exchange ||
          current.instrumentGroup != current.instrumentGroup)) {
        // ToDo: Неочевидно, но так из-за того что у нас settings это и subject и input.
        this.settings$.next(current);
      }
    })

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
    this.instrumentSub.unsubscribe();
  }

  getBidStyle(value: number) {
    const size = 100 * (value / this.maxVolume);
    return {
      background: `linear-gradient(270deg, ${buyColorBackground} ${size}% , rgba(0,0,0,0) ${size}%)`,
    };
  }

  getAskStyle(value: number) {
    const size = 100 * (value / this.maxVolume);
    return {
      background: `linear-gradient(90deg, ${sellColorBackground} ${size}%, rgba(0,0,0,0) ${size}%)`,
    };
  }

  newLimitOrder(side: string, price: number) {
    const params: CommandParams = {
      instrument: { ...this.settings$.getValue() },
      side: side == 'buy' ? Side.Buy : Side.Sell,
      price,
      quantity: 0,
      type: CommandType.Limit
    }
    this.sync.openCommandModal(params);
  }
}
