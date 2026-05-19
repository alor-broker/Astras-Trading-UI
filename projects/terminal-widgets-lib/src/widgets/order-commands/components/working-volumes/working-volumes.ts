import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  filter,
  Observable,
  shareReplay,
  switchMap
} from "rxjs";
import {
  map,
  startWith
} from "rxjs/operators";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {AsyncPipe} from '@angular/common';
import {toObservable} from "@angular/core/rxjs-interop";
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {OrderbookService} from '@terminal-core-lib/features/instruments/services/orderbook.service';
import {
  OrderbookData,
  OrderbookDataRow
} from '@terminal-core-lib/features/instruments/services/orderbook-service.types';

@Component({
  selector: 'ats-working-volumes',
  templateUrl: './working-volumes.html',
  styleUrls: ['./working-volumes.less'],
  imports: [
    TranslocoDirective,
    NzTooltipDirective,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WorkingVolumes implements OnInit {
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

  private readonly orderbookService = inject(OrderbookService);

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
      switchMap(settings => this.orderbookService.getOrderbookSubscription(
        settings.symbol,
        settings.exchange,
        settings.instrumentGroup,
        1
      )),
      filter(x => !!(x as OrderbookData | null)),
      map(orderbook => {
          const bestAsk = orderbook.a[0] as OrderbookDataRow | undefined;
          const bestBid = orderbook.b[0] as OrderbookDataRow | undefined;

          return {
            ask: bestAsk
              ? {
                price: bestAsk.p,
                volume: bestAsk.v
              }
              : null,
            bid: bestBid
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
