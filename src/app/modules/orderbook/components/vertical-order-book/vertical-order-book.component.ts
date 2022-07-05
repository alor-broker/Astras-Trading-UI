import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderbookService } from "../../services/orderbook.service";
import {
  Observable,
  shareReplay,
  switchMap,
  tap
} from "rxjs";
import {
  VerticalOrderBookRowType,
  VerticalOrderBookRowView
} from "../../models/vertical-order-book.model";
import { VerticalOrderBookSettings } from "../../../../shared/models/settings/vertical-order-book-settings.model";
import { map } from "rxjs/operators";
import {
  buyColorBackground,
  sellColorBackground
} from "../../../../shared/models/settings/styles-constants";

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

  constructor(private readonly settingsService: WidgetSettingsService, private readonly orderBookService: OrderbookService) {
  }

  ngOnInit(): void {
    const settings$ = this.settingsService.getSettings<VerticalOrderBookSettings>(this.guid).pipe(shareReplay());

    this.orderBookRows$ = settings$.pipe(
      switchMap(settings => this.orderBookService.getVerticalOrderBook(settings)),
      map(orderBook => {
        const asks = orderBook.asks.map(x => ({
          ...x, rowType: VerticalOrderBookRowType.Ask
        } as VerticalOrderBookRowView)).sort((a, b) => b.price - a.price);

        if (asks.length > 0) {
          asks[asks.length - 1].isBest = true;
        }

        const bids = orderBook.bids.map(x => ({
          ...x, rowType: VerticalOrderBookRowType.Bid
        } as VerticalOrderBookRowView)).sort((a, b) => b.price - a.price);

        if (bids.length > 0) {
          bids[0].isBest = true;
        }

        return [...asks, ...bids];
      }),
      tap(orderBookRows => {
        this.maxVolume = Math.max(...orderBookRows.map(x => x.volume ?? 0));
      })
    );
  }

  getTrackKey(index: number): number {
    return index;
  }

  getVolumeStyle(rowType: VerticalOrderBookRowType,  volume: number) {
    const size = 100 * (volume / this.maxVolume);
    if(rowType === VerticalOrderBookRowType.Bid) {
      return {
        background: `linear-gradient(90deg, ${buyColorBackground} ${size}% , rgba(0,0,0,0) ${size}%)`,
      };
    } else if(rowType === VerticalOrderBookRowType.Ask) {
      return {
        background: `linear-gradient(90deg, ${sellColorBackground} ${size}%, rgba(0,0,0,0) ${size}%)`,
      };
    }

    return null;
  }
}
