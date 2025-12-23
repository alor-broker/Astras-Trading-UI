import { Component, input, OnInit, output, inject } from '@angular/core';
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {filter, Observable, shareReplay, switchMap} from "rxjs";
import {OrderbookData, OrderbookDataRow, OrderbookRequest} from "../../../orderbook/models/orderbook-data.model";
import {OrderBookDataFeedHelper} from "../../../orderbook/utils/order-book-data-feed.helper";
import {map, startWith} from "rxjs/operators";
import {SubscriptionsDataFeedService} from "../../../../shared/services/subscriptions-data-feed.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {AsyncPipe} from '@angular/common';
import {toObservable} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-working-volumes',
  templateUrl: './working-volumes.component.html',
  styleUrls: ['./working-volumes.component.less'],
  imports: [
    TranslocoDirective,
    NzTooltipDirective,
    AsyncPipe
  ]
})
export class WorkingVolumesComponent implements OnInit {
  private readonly subscriptionsDataFeedService = inject(SubscriptionsDataFeedService);

  currentAskBid$!: Observable<{
    ask: { volume: number, price: number } | null;
    bid: { volume: number, price: number } | null;
  } | null>;

  readonly workingVolumes = input<number[]>([]);

  readonly itemSelected = output<{
    volume: number;
    price?: number;
}>();

  readonly instrumentKey = input<InstrumentKey>();

  private readonly instrumentKeyChanges$ = toObservable(this.instrumentKey).pipe(
    startWith(null),
    shareReplay(1)
  );

  get sortedVolumes(): number[] {
    return [...this.workingVolumes()].sort((a, b) => a - b);
  }

  emitItemSelected(volume: number, price?: number): void {
    this.itemSelected.emit({
      volume,
      price
    });
  }

  ngOnInit(): void {
    this.currentAskBid$ = this.instrumentKeyChanges$.pipe(
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
