import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  of,
  shareReplay,
  switchMap
} from 'rxjs';
import { OrderbookService } from '../../services/orderbook.service';
import {
  ChartData,
  OrderBook
} from '../../models/orderbook.model';
import {
  map,
  startWith
} from 'rxjs/operators';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { MathHelper } from "../../../../shared/utils/math-helper";
import {
  ColumnsOrder,
  OrderbookSettings
} from '../../models/orderbook-settings.model';

interface Size {
  width: string;
  height: string;
}

interface SpreadDiffData {
  diffPercents: number;
  diff: number;
  colorRatio: number;
}

@Component({
  selector: 'ats-order-book',
  templateUrl: './orderbook.component.html',
  styleUrls: ['./orderbook.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class OrderBookComponent implements OnInit {
  @Input({required: true})
  guid!: string;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  ob$: Observable<OrderBook | null> = of(null);
  spreadDiffData$: Observable<SpreadDiffData | null> = of(null);
  columnsOrderEnum = ColumnsOrder;
  settings$!: Observable<OrderbookSettings>;
  sizes: BehaviorSubject<Size> = new BehaviorSubject<Size>({
    width: '100%',
    height: '100%',
  });
  private readonly minSpreadDiffPercentForColorChange = 0.3;
  private readonly maxSpreadDiffPercentForColorChange = 1;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: OrderbookService
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      shareReplay(1)
    );


    this.ob$ = this.settings$.pipe(
      switchMap(settings => this.service.getOrderBook(settings)),
      startWith(<OrderBook>{
        rows: [],
        maxVolume: 1,
        chartData: <ChartData>{
          asks: [],
          bids: [],
          minPrice: 0,
          maxPrice: 0
        },
        bidVolumes: 0,
        askVolumes: 0,
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.spreadDiffData$ = this.ob$.pipe(
      map(ob => {
        const bestBid = ob?.rows[0]?.bid;
        const bestAsk = ob?.rows[0]?.ask;

        if (!(bestBid ?? 0) || !(bestAsk ?? 0)) {
          return null;
        }

        const decimalsCount = Math.max(MathHelper.getPrecision(bestAsk!), MathHelper.getPrecision(bestBid!));
        const diff = MathHelper.round(bestAsk! - bestBid!, decimalsCount);
        const diffPercents = MathHelper.round((diff / bestBid!) * 100, 3);

        let colorRatio = MathHelper.round(
          (
            (diffPercents - this.minSpreadDiffPercentForColorChange) /
            (this.maxSpreadDiffPercentForColorChange - this.minSpreadDiffPercentForColorChange)
          ),
          2
        );

        if (colorRatio < 0) {
          colorRatio = 0;
        }
        if (colorRatio > 1) {
          colorRatio = 1;
        }

        return {
          diffPercents,
          diff,
          colorRatio
        };
      })
    );
  }
}
