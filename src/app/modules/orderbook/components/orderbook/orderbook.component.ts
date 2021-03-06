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
import {
  BehaviorSubject,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
} from 'rxjs';
import { DashboardItem } from '../../../../shared/models/dashboard-item.model';
import { OrderbookService } from '../../services/orderbook.service';
import {
  ChartData,
  OrderBook
} from '../../models/orderbook.model';
import {
  map,
  startWith,
  tap
} from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import {
  buyColorBackground,
  sellColorBackground,
} from '../../../../shared/models/settings/styles-constants';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { getTypeByCfi } from 'src/app/shared/utils/instruments';
import { InstrumentType } from 'src/app/shared/models/enums/instrument-type.model';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderbookSettings } from "../../../../shared/models/settings/orderbook-settings.model";
import { InstrumentsService } from "../../../instruments/services/instruments.service";

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

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly instrumentsService: InstrumentsService,
    private readonly service: OrderbookService,
    private readonly modal: ModalService) {
  }

  ngOnInit(): void {
    const settings$ = this.settingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      shareReplay()
    );

    this.shouldShowTable$ = settings$.pipe(
      map((s) => s.showTable)
    );

    this.shouldShowYield$ = settings$.pipe(
      switchMap(settings => {
        if (!settings.showYieldForBonds) {
          return of(false);
        }

        return this.instrumentsService.getInstrument({
          symbol: settings.symbol,
          exchange: settings.exchange,
          instrumentGroup: settings.instrumentGroup
        }).pipe(
          map(x => !!x && getTypeByCfi(x.cfiCode) === InstrumentType.Bond)
        );
      }),
      shareReplay()
    );

    this.ob$ = settings$.pipe(
      switchMap(settings => this.service.getHorizontalOrderBook(settings)),
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
    ));
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
    this.settingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      take(1)
    ).subscribe(settings => {
      const params: CommandParams = {
        instrument: { ...settings },
        price,
        quantity: quantity ?? 1,
        type: CommandType.Limit,
      };
      this.modal.openCommandModal(params);
    });
  }

  getTrackKey(index: number): number {
    return index;
  }
}
