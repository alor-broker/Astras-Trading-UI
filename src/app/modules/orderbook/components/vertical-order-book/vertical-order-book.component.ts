import {
  Component,
  ElementRef,
  Input,
  OnInit,
} from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderbookService } from "../../services/orderbook.service";
import {
  delay,
  filter,
  Observable,
  shareReplay,
  take,
  tap
} from "rxjs";
import {
  CurrentOrder,
  OrderBookItem,
  VerticalOrderBook,
  VerticalOrderBookRowType,
  VerticalOrderBookRowView
} from "../../models/vertical-order-book.model";
import {
  VerticalOrderBookSettings,
  VolumeHighlightOption
} from "../../../../shared/models/settings/vertical-order-book-settings.model";
import {
  map,
  startWith
} from "rxjs/operators";
import {
  buyColorBackground,
  sellColorBackground
} from "../../../../shared/models/settings/styles-constants";
import { CancelCommand } from "../../../../shared/models/commands/cancel-command.model";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { getTypeByCfi } from "../../../../shared/utils/instruments";
import { InstrumentType } from "../../../../shared/models/enums/instrument-type.model";

@Component({
  selector: 'ats-vertical-order-book[guid][shouldShowSettings]',
  templateUrl: './vertical-order-book.component.html',
  styleUrls: ['./vertical-order-book.component.less']
})
export class VerticalOrderBookComponent implements OnInit {
  rowTypes = VerticalOrderBookRowType;
  maxVolume: number = 1;

  @Input() shouldShowSettings!: boolean;
  @Input() guid!: string;

  orderBookRows$!: Observable<VerticalOrderBookRowView[]>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly orderBookService: OrderbookService,
    private readonly instrumentsService: InstrumentsService,
    private readonly elementRef: ElementRef<HTMLElement>) {
  }

  ngOnInit(): void {
    const settings$ = this.settingsService.getSettings<VerticalOrderBookSettings>(this.guid).pipe(shareReplay());
    const getInstrumentInfo = (settings: VerticalOrderBookSettings) => this.instrumentsService.getInstrument(settings).pipe(
      filter((x): x is Instrument => !!x)
    );

    this.orderBookRows$ = settings$.pipe(
      mapWith(
        settings => getInstrumentInfo(settings),
        (settings, instrument) => ({ settings, instrument })
      ),
      mapWith(
        ({ settings, instrument }) => this.orderBookService.getVerticalOrderBook(settings, instrument),
        ({ settings, instrument }, orderBook) => ({ settings, instrument, orderBook })
      ),
      map(x => this.toViewModel(x.settings, x.instrument, x.orderBook)),
      tap(orderBookRows => {
        this.maxVolume = Math.max(...orderBookRows.map(x => x.volume ?? 0));
      }),
      startWith([]),
      shareReplay()
    );

    this.orderBookRows$.pipe(
      take(2),
      delay(1000)
    ).subscribe(() => this.alignBySpread());
  }

  getTrackKey(index: number): number {
    return index;
  }

  getCurrentOrdersVolume(orders: CurrentOrder[]): number | null {
    return orders.length === 0
      ? null
      : orders.reduce((previousValue, currentValue) => previousValue + currentValue.volume, 0);
  }

  getVolumeStyle(rowType: VerticalOrderBookRowType, volume: number, settings: VerticalOrderBookSettings) {
    if (rowType !== VerticalOrderBookRowType.Ask && rowType !== VerticalOrderBookRowType.Bid || !volume) {
      return null;
    }

    if (!settings.highlightHighVolume) {
      const size = 100 * (volume / this.maxVolume);
      const color = rowType === VerticalOrderBookRowType.Bid
        ? buyColorBackground
        : sellColorBackground;

      return {
        background: `linear-gradient(90deg, ${color} ${size}% , rgba(0,0,0,0) ${size}%)`,
      };
    }

    const volumeHighlightOption = this.getVolumeHighlightOption(settings, volume);
    if(!volumeHighlightOption) {
      return null;
    }

    const size = 100 * (volume / volumeHighlightOption.boundary);

    return {
      background: `linear-gradient(90deg, ${volumeHighlightOption.color}BF ${size}% , rgba(0,0,0,0) ${size}%)`
    };
  }

  cancelOrders(orders: CurrentOrder[]) {
    for (const order of orders) {
      this.orderBookService.cancelOrder({
        orderid: order.orderId,
        exchange: order.exchange,
        portfolio: order.portfolio,
        stop: false
      } as CancelCommand);
    }
  }

  alignBySpread() {
    let targetElement: Element | null = null;
    const spreadElements = this.elementRef.nativeElement.querySelectorAll('.spread-row');
    if(spreadElements.length > 0) {
      targetElement = spreadElements.item(Math.floor(spreadElements.length / 2));
    } else {
      targetElement = this.elementRef.nativeElement.querySelector('.best-row');
    }

    if(!!targetElement) {
      targetElement.scrollIntoView({block: 'center', inline: 'center', behavior: 'smooth'});
    }
  }

  private getVolumeHighlightOption(settings: VerticalOrderBookSettings, volume: number): VolumeHighlightOption | undefined {
    return [...settings.volumeHighlightOptions]
      .sort((a, b) => a.boundary - b.boundary)
      .find(x => volume <= x.boundary);
  }

  private toViewModel(settings: VerticalOrderBookSettings, instrumentInfo: Instrument, orderBook: VerticalOrderBook): VerticalOrderBookRowView[] {
    const displayYield = settings.showYieldForBonds && getTypeByCfi(instrumentInfo.cfiCode) === InstrumentType.Bond;

    const asks = this.toVerticalOrderBookRowView(
      orderBook.asks,
      VerticalOrderBookRowType.Ask,
      item => displayYield ? item.yield : item.price,
      settings
    );

    if (asks.length > 0) {
      asks[asks.length - 1].isBest = true;
    }

    const bids = this.toVerticalOrderBookRowView(
      orderBook.bids,
      VerticalOrderBookRowType.Bid,
      item => displayYield ? item.yield : item.price,
      settings
    );

    if (bids.length > 0) {
      bids[0].isBest = true;
    }

    const spreadItems = this.toVerticalOrderBookRowView(
      orderBook.spreadItems ?? [],
      VerticalOrderBookRowType.Spread,
      item => item.price,
      settings
    );


    return [...asks, ...spreadItems, ...bids];
  }

  private toVerticalOrderBookRowView(
    items: OrderBookItem[],
    rowType: VerticalOrderBookRowType,
    displayValueSelector: (item: OrderBookItem) => number | undefined,
    settings: VerticalOrderBookSettings): VerticalOrderBookRowView[] {
    return items.map(x => ({
        ...x,
        currentOrders: x.currentOrders ?? [],
        rowType: rowType,
        displayValue: displayValueSelector(x),
        getVolumeStyle: () => this.getVolumeStyle(rowType, x.volume ?? 0, settings)
      } as VerticalOrderBookRowView)
    ).sort((a, b) => b.displayValue - a.displayValue);
  }
}
