import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, merge, Observable, of, Subscription, zip } from 'rxjs';
import { DashboardItem } from '../../../../shared/models/dashboard-item.model';
import { OrderbookService } from '../../services/orderbook.service';
import { OrderBook } from '../../models/orderbook.model';
import { OrderbookSettings } from '../../../../shared/models/settings/orderbook-settings.model';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { Widget } from 'src/app/shared/models/widget.model';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { SyncService } from 'src/app/shared/services/sync.service';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import {
  sellColorBackground,
  buyColorBackground,
} from '../../../../shared/models/settings/styles-constants';

interface Size {
  width: string;
  height: string;
}

@Component({
  selector: 'ats-order-book[guid][resize][shouldShowSettings]',
  templateUrl: './order-book.component.html',
  styleUrls: ['./order-book.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class OrderBookComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  shouldShowTable$: Observable<boolean> = of(true);

  resizeSub!: Subscription;
  ob$: Observable<OrderBook | null> = of(null);
  maxVolume: number = 1;

  sizes: BehaviorSubject<Size> = new BehaviorSubject<Size>({
    width: '100%',
    height: '100%',
  });

  constructor(private service: OrderbookService, private sync: SyncService) {}

  ngOnInit(): void {
    this.shouldShowTable$ = this.service.getSettings(this.guid).pipe(
      map((s) => s.showTable)
    );
    this.ob$ = this.service.getOrderbook(this.guid).pipe(
      tap((ob) => (this.maxVolume = ob?.maxVolume ?? 1))
    );
    this.resizeSub = this.resize.subscribe((widget) => {
      this.sizes.next({
        width: (widget.width ?? 0) + 'px',
        height: ((widget.height ?? 0) - 30) + 'px',
      });
    });
  }

  ngOnDestroy(): void {
    console.warn('destroy')
    this.service.unsubscribe();
    this.resizeSub.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.warn('Changes')
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

  newLimitOrder(price: number, quantity?: number) {
    const settings = this.service.getSettingsValue();
    if (settings) {
      const params: CommandParams = {
        instrument: { ...settings },
        price,
        quantity: quantity ?? 0,
        type: CommandType.Limit,
      };
      this.sync.openCommandModal(params);
    }
  }
}
