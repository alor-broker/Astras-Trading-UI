import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderbookService } from "../../services/orderbook.service";
import {
  filter,
  Observable,
  shareReplay,
  switchMap,
  tap,
  withLatestFrom
} from "rxjs";
import {
  VerticalOrderBook,
  VerticalOrderBookRowType,
  VerticalOrderBookRowView
} from "../../models/vertical-order-book.model";
import { VerticalOrderBookSettings } from "../../../../shared/models/settings/vertical-order-book-settings.model";
import {
  map,
  startWith
} from "rxjs/operators";
import {
  buyColorBackground,
  sellColorBackground
} from "../../../../shared/models/settings/styles-constants";
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
    private readonly instrumentsService: InstrumentsService) {
  }

  ngOnInit(): void {
    const settings$ = this.settingsService.getSettings<VerticalOrderBookSettings>(this.guid).pipe(shareReplay());
    const instrumentInfo$ = settings$.pipe(
      switchMap(settings => this.instrumentsService.getInstrument(settings)),
      filter((x): x is Instrument => !!x),
      shareReplay()
    );

    this.orderBookRows$ = settings$.pipe(
      mapWith(settings => this.orderBookService.getVerticalOrderBook(settings), (settings, orderBook) => ({
        settings,
        orderBook
      })),
      withLatestFrom(instrumentInfo$),
      map(([x, instrumentInfo]) => this.toViewModel(x.settings, instrumentInfo, x.orderBook)),
      tap(orderBookRows => {
        this.maxVolume = Math.max(...orderBookRows.map(x => x.volume ?? 0));
      }),
      startWith([])
    );
  }

  getTrackKey(index: number): number {
    return index;
  }

  getVolumeStyle(rowType: VerticalOrderBookRowType, volume: number) {
    const size = 100 * (volume / this.maxVolume);
    if (rowType === VerticalOrderBookRowType.Bid) {
      return {
        background: `linear-gradient(90deg, ${buyColorBackground} ${size}% , rgba(0,0,0,0) ${size}%)`,
      };
    } else if (rowType === VerticalOrderBookRowType.Ask) {
      return {
        background: `linear-gradient(90deg, ${sellColorBackground} ${size}%, rgba(0,0,0,0) ${size}%)`,
      };
    }

    return null;
  }

  private toViewModel(settings: VerticalOrderBookSettings, instrumentInfo: Instrument, orderBook: VerticalOrderBook): VerticalOrderBookRowView[] {
    const displayYield = settings.showYieldForBonds && getTypeByCfi(instrumentInfo.cfiCode) === InstrumentType.Bond;

    const asks = orderBook.asks.map(x => ({
        ...x,
        rowType: VerticalOrderBookRowType.Ask,
        displayValue: displayYield ? x.yield : x.price
      } as VerticalOrderBookRowView)
    ).sort((a, b) => b.displayValue - a.displayValue);

    if (asks.length > 0) {
      asks[asks.length - 1].isBest = true;
    }

    const bids = orderBook.bids.map(x => ({
        ...x,
        rowType: VerticalOrderBookRowType.Bid,
        displayValue: displayYield ? x.yield : x.price
      } as VerticalOrderBookRowView)
    ).sort((a, b) => b.displayValue - a.displayValue);

    if (bids.length > 0) {
      bids[0].isBest = true;
    }

    return [...asks, ...bids];
  }
}
