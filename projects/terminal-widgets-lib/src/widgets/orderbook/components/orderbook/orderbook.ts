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
  BehaviorSubject,
  filter,
  Observable,
  of,
  shareReplay,
  switchMap
} from 'rxjs';
import {
  map,
  startWith
} from 'rxjs/operators';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  AsyncPipe,
  DecimalPipe
} from '@angular/common';
import {
  Instrument,
  InstrumentType
} from '@terminal-core-lib/common/types/instrument.types';
import {OrderbookChart} from '@terminal-widgets-lib/widgets/orderbook/components/orderbook-chart/orderbook-chart';
import {
  ChartData,
  OrderBook,
  OrderbookDisplaySettings
} from '@terminal-widgets-lib/widgets/orderbook/types/orderbook.types';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {ColumnsOrder} from '@terminal-widgets-lib/widgets/orderbook/widget-settings.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {toObservable} from '@angular/core/rxjs-interop';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {OrderbookService} from '@terminal-widgets-lib/widgets/orderbook/services/orderbook.service';
import {InstrumentHelper} from '@terminal-core-lib/features/instruments/utils/instrument-helper';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {OrderbookTableVolumesAtTheEdges} from '@terminal-widgets-lib/widgets/orderbook/components/orderbook-tables/orderbook-table-volumes-at-the-edges/orderbook-table-volumes-at-the-edges';
import {OrderbookTableVolumesAtTheMiddle} from '@terminal-widgets-lib/widgets/orderbook/components/orderbook-tables/orderbook-table-volumes-at-the-middle/orderbook-table-volumes-at-the-middle';

interface Size {
  width: string;
  height: string;
}

interface SpreadDiffData {
  diffPercents: number;
  diff: number;
  colorRatio: number;
}

type InstrumentExtended = Instrument & { isBond: boolean };

@Component({
  selector: 'ats-order-book',
  templateUrl: './orderbook.html',
  styleUrls: ['./orderbook.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    OrderbookChart,
    TranslocoDirective,
    AsyncPipe,
    DecimalPipe,
    OrderbookTableVolumesAtTheEdges,
    OrderbookTableVolumesAtTheMiddle
  ],
  providers: [OrderbookService]
})
export class OrderBookComponent implements OnInit {
  readonly settings = input.required<OrderbookDisplaySettings>();

  readonly NumberDisplayFormat = NumberDisplayFormat;

  ob$: Observable<OrderBook | null> = of(null);

  spreadDiffData$: Observable<SpreadDiffData | null> = of(null);

  columnsOrderEnum = ColumnsOrder;

  sizes: BehaviorSubject<Size> = new BehaviorSubject<Size>({
    width: '100%',
    height: '100%',
  });

  readonly rowSelected = output<{ price: number, side: Side }>();

  protected targetInstrument$!: Observable<InstrumentExtended>;

  private readonly settingsChanges$ = toObservable(this.settings).pipe(
    shareReplay(1)
  );

  private readonly service = inject(OrderbookService);

  private readonly instrumentsService = inject(InstrumentsService);

  private readonly minSpreadDiffPercentForColorChange = 0.3;

  private readonly maxSpreadDiffPercentForColorChange = 1;

  ngOnInit(): void {
    this.ob$ = this.settingsChanges$.pipe(
      switchMap(settings => this.service.getOrderBook(settings.targetInstrument, settings.display.depth ?? 10)),
      startWith(<OrderBook>{
        rows: [],
        maxVolume: 1,
        chartData: <ChartData>{
          asks: [],
          bids: []
        },
        bidVolumes: 0,
        askVolumes: 0,
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.targetInstrument$ = this.settingsChanges$.pipe(
      switchMap(s => this.instrumentsService.getInstrument(s.targetInstrument)),
      filter(instrument => instrument !== null),
      map(instrument => ({
          ...instrument,
          isBond: InstrumentHelper.getTypeByCfi(instrument.cfiCode) === InstrumentType.Bond
        })
      ),
      shareReplay(1)
    );

    this.spreadDiffData$ = this.ob$.pipe(
      map(ob => {
        const bestBid = ob?.rows[0]?.bid;
        const bestAsk = ob?.rows[0]?.ask;

        if (bestBid == null || bestAsk == null) {
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
