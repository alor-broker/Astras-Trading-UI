import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, Subject, takeUntil } from 'rxjs';
import { DashboardItem } from '../../../../shared/models/dashboard-item.model';
import { OrderbookService } from '../../services/orderbook.service';
import { ChartData, OrderBook } from '../../models/orderbook.model';
import { map, startWith, tap } from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { buyColorBackground, sellColorBackground, } from '../../../../shared/models/settings/styles-constants';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { getSelectedInstrument } from "../../../../store/instruments/instruments.selectors";
import { select, Store } from '@ngrx/store';
import { getTypeByCfi } from 'src/app/shared/utils/instruments';
import { InstrumentType } from 'src/app/shared/models/enums/instrument-type.model';

interface Size {
  width: string;
  height: string;
}

@Component({
  selector: 'ats-order-book[guid][resize][shouldShowSettings]',
  templateUrl: './orderbook.component.html',
  styleUrls: ['./orderbook.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class OrderBookComponent implements OnInit, OnDestroy {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  shouldShowYield$: Observable<boolean> = of(false);
  shouldShowTable$: Observable<boolean> = of(true);
  ob$: Observable<OrderBook | null> = of(null);
  maxVolume: number = 1;
  sizes: BehaviorSubject<Size> = new BehaviorSubject<Size>({
    width: '100%',
    height: '100%',
  });
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private service: OrderbookService, private modal: ModalService, private readonly store: Store) {
  }

  ngOnInit(): void {
    this.shouldShowTable$ = this.service.getSettings(this.guid).pipe(
      map((s) => s.showTable)
    );

    this.shouldShowYield$ = combineLatest([
      this.service.getSettings(this.guid),
      this.store.pipe(select(getSelectedInstrument))]).pipe(
        map(([settings, instrument]) => getTypeByCfi(instrument.cfiCode) === InstrumentType.Bond && settings.showYieldForBonds)
    );

    this.ob$ = this.service.getOrderbook(this.guid).pipe(
      tap((ob) => (this.maxVolume = ob?.maxVolume ?? 1)),
      startWith(<OrderBook>{
          rows: [],
          maxVolume: 1,
          chartData: <ChartData>{
            asks: [],
            bids: [],
            minPrice: 0,
            maxPrice: 0
          }
        }
      )
    );

    this.resize.pipe(
      takeUntil(this.destroy$)
    ).subscribe((widget) => {
      this.sizes.next({
        width: (widget.width ?? 0) - 20 + 'px',
        height: ((widget.height ?? 0) - 40) + 'px',
      });
    });
  }

  ngOnDestroy(): void {
    this.service.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.complete();
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

  cancelOrder(event: MouseEvent, cancells: CancelCommand[]) {
    event.stopPropagation();
    for (const cancel of cancells) {
      this.service.cancelOrder(cancel);
    }
  }

  newLimitOrder(event: MouseEvent, price: number, quantity?: number) {
    event.stopPropagation();
    const settings = this.service.getSettingsValue();
    if (settings) {
      const params: CommandParams = {
        instrument: { ...settings },
        price,
        quantity: quantity ?? 1,
        type: CommandType.Limit,
      };
      this.modal.openCommandModal(params);
    }
  }

  getTrackKey(index: number): number {
    return index;
  }
}
