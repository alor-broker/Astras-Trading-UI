import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {BehaviorSubject, filter, Observable, shareReplay, switchMap} from "rxjs";
import { OrderbookData, OrderbookDataRow, OrderbookRequest } from "../../../orderbook/models/orderbook-data.model";
import {OrderBookDataFeedHelper} from "../../../orderbook/utils/order-book-data-feed.helper";
import {map, startWith} from "rxjs/operators";
import {SubscriptionsDataFeedService} from "../../../../shared/services/subscriptions-data-feed.service";

@Component({
  selector: 'ats-working-volumes',
  templateUrl: './working-volumes.component.html',
  styleUrls: ['./working-volumes.component.less']
})
export class WorkingVolumesComponent implements OnInit {
  readonly instrumentKey$ = new BehaviorSubject<InstrumentKey | null>(null);
  currentAskBid$!: Observable<{
    ask: { volume: number, price: number } | null;
    bid: { volume: number, price: number } | null;
  } | null>;

  @Input()
  workingVolumes: number[] = [];
  @Output()
  itemSelected = new EventEmitter<{ volume: number, price?: number }>();

  constructor(private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService) {
  }

  @Input()
  set instrumentKey(value: InstrumentKey) {
    this.instrumentKey$.next(value);
  }

  get sortedVolumes(): number[] {
    return [...this.workingVolumes].sort((a, b) => a - b);
  }

  emitItemSelected(volume: number, price?: number): void {
    this.itemSelected.emit({
      volume,
      price
    });
  }

  ngOnInit(): void {
    this.currentAskBid$ = this.instrumentKey$.pipe(
      filter((i): i is InstrumentKey => !!i),
      switchMap(settings => this.subscriptionsDataFeedService.subscribe<OrderbookRequest, OrderbookData>(
        OrderBookDataFeedHelper.getRealtimeDateRequest(
          settings.symbol,
          settings.exchange,
          settings.instrumentGroup,
          1
        ),
        OrderBookDataFeedHelper.getOrderbookSubscriptionId
      )),
      filter(x => !!(x as OrderbookData | null)),
      map(orderbook => {
          const bestAsk = orderbook.a[0] as OrderbookDataRow | undefined;
          const bestBid = orderbook.b[0] as OrderbookDataRow | undefined;

          return {
            ask: !!bestAsk
              ? {
                price: bestAsk.p,
                volume: bestAsk.v
              }
              : null,
            bid: !!bestBid
              ? {
                price: bestBid.p,
                volume: bestBid.v
              }
              : null
          };
        }
      ),
      startWith(null),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }
}
