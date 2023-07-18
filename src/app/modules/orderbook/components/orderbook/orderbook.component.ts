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
import { WidgetsDataProviderService } from "../../../../shared/services/widgets-data-provider.service";
import { SelectedPriceData } from "../../../../shared/models/orders/selected-order-price.model";
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
  diff: number
  colorRatio: number;
}

@Component({
  selector: 'ats-order-book[guid]',
  templateUrl: './orderbook.component.html',
  styleUrls: ['./orderbook.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class OrderBookComponent implements OnInit, OnDestroy {
  @Input()
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
  private minSpreadDiffPercentForColorChange = 0.3;
  private maxSpreadDiffPercentForColorChange = 1;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: OrderbookService,
    private readonly widgetsDataProvider: WidgetsDataProviderService
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

        if (!bestBid || !bestAsk) {
          return null;
        }

        const decimalsCount = Math.max(MathHelper.getPrecision(bestAsk), MathHelper.getPrecision(bestBid));
        const diff = MathHelper.round(bestAsk - bestBid, decimalsCount);
        const diffPercents = MathHelper.round((diff / bestBid) * 100, 3);

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

    this.widgetsDataProvider.addNewDataProvider<SelectedPriceData>('selectedPrice');
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
