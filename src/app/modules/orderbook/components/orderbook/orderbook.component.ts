import {ChangeDetectionStrategy, Component, inject, input, OnInit, output, ViewEncapsulation} from '@angular/core';
import {BehaviorSubject, filter, Observable, of, shareReplay, switchMap} from 'rxjs';
import {OrderbookService} from '../../services/orderbook.service';
import {ChartData, OrderBook} from '../../models/orderbook.model';
import {map, startWith} from 'rxjs/operators';
import {MathHelper} from "../../../../shared/utils/math-helper";
import {ColumnsOrder} from '../../models/orderbook-settings.model';
import {OrderbookChartComponent} from '../orderbook-chart/orderbook-chart.component';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe, DecimalPipe, NgStyle} from '@angular/common';
import {
  OrderbookTableVolumesAtTheEdgesComponent
} from '../orderbook-tables/orderbook-table-volumes-at-the-edges/orderbook-table-volumes-at-the-edges.component';
import {
  OrderbookTableVolumesAtTheMiddleComponent
} from '../orderbook-tables/orderbook-table-volumes-at-the-middle/orderbook-table-volumes-at-the-middle.component';
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {NumberDisplayFormat} from "../../../../shared/models/enums/number-display-format";
import {toObservable} from "@angular/core/rxjs-interop";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {getTypeByCfi} from "../../../../shared/utils/instruments";
import {InstrumentType} from "../../../../shared/models/enums/instrument-type.model";
import { Side } from "../../../../shared/models/enums/side.model";

export interface OrderbookComponentSettings {
  targetInstrument: InstrumentKey;
  display: {
    depth?: number;
    showChart: boolean;
    showTable: boolean;
    showYieldForBonds: boolean;
    showVolume?: boolean;
    columnsOrder?: ColumnsOrder;
    volumeDisplayFormat?: NumberDisplayFormat;
    showPriceWithZeroPadding?: boolean;
    showSpread?: boolean;
  };
}

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
  templateUrl: './orderbook.component.html',
  styleUrls: ['./orderbook.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    OrderbookChartComponent,
    TranslocoDirective,
    NgStyle,
    OrderbookTableVolumesAtTheEdgesComponent,
    OrderbookTableVolumesAtTheMiddleComponent,
    AsyncPipe,
    DecimalPipe
  ]
})
export class OrderBookComponent implements OnInit {
  readonly settings = input.required<OrderbookComponentSettings>();

  readonly NumberDisplayFormat = NumberDisplayFormat;

  ob$: Observable<OrderBook | null> = of(null);

  spreadDiffData$: Observable<SpreadDiffData | null> = of(null);

  columnsOrderEnum = ColumnsOrder;

  sizes: BehaviorSubject<Size> = new BehaviorSubject<Size>({
    width: '100%',
    height: '100%',
  });

  readonly rowSelected = output<{price: number, side: Side}>();

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
          isBond: getTypeByCfi(instrument.cfiCode) === InstrumentType.Bond
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
