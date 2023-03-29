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
import { BehaviorSubject, combineLatest, Observable, of, shareReplay, Subject, switchMap } from 'rxjs';
import { OrderbookService } from '../../services/orderbook.service';
import { ChartData, OrderBook } from '../../models/orderbook.model';
import { map, startWith, tap } from 'rxjs/operators';
import { getTypeByCfi } from 'src/app/shared/utils/instruments';
import { InstrumentType } from 'src/app/shared/models/enums/instrument-type.model';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { WidgetsDataProviderService } from "../../../../shared/services/widgets-data-provider.service";
import { SelectedPriceData } from "../../../../shared/models/orders/selected-order-price.model";
import { ThemeService } from '../../../../shared/services/theme.service';
import { ThemeSettings } from '../../../../shared/models/settings/theme-settings.model';
import { MathHelper } from "../../../../shared/utils/math-helper";
import { ColumnsOrder, OrderbookSettings } from '../../models/orderbook-settings.model';

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

  private minSpreadDiffPercentForColorChange = 0.3;
  private maxSpreadDiffPercentForColorChange = 1;
  private destroy$: Subject<boolean> = new Subject<boolean>();


  shouldShowYield$: Observable<boolean> = of(false);
  shouldShowTable$: Observable<boolean> = of(true);
  shouldShowVolumes$: Observable<boolean> = of(false);
  columnsOrder$: Observable<ColumnsOrder> = of(ColumnsOrder.volumesAtTheEdges);
  ob$: Observable<OrderBook | null> = of(null);
  spreadDiffData$: Observable<SpreadDiffData | null> = of(null);
  maxVolume: number = 1;
  themeSettings?: ThemeSettings;
  columnsOrderEnum = ColumnsOrder;

  sizes: BehaviorSubject<Size> = new BehaviorSubject<Size>({
    width: '100%',
    height: '100%',
  });

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly instrumentsService: InstrumentsService,
    private readonly service: OrderbookService,
    private readonly widgetsDataProvider: WidgetsDataProviderService,
    private readonly themeService: ThemeService) {
  }

  ngOnInit(): void {
    const settings$ = this.settingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      shareReplay()
    );

    this.shouldShowTable$ = settings$.pipe(
      map((s) => s.showTable)
    );

    this.shouldShowVolumes$ = settings$.pipe(
      map((s) => s.showVolume)
    );

    this.columnsOrder$ = settings$.pipe(
      map(s => s.columnsOrder ?? ColumnsOrder.volumesAtTheEdges)
    );

    this.shouldShowYield$ = settings$.pipe(
      switchMap(settings => {
        if (!settings.showYieldForBonds) {
          return of(false);
        }

        return this.instrumentsService.getInstrument({
          symbol: settings.symbol,
          exchange: settings.exchange,
          instrumentGroup: settings.instrumentGroup
        }).pipe(
          map(x => !!x && getTypeByCfi(x.cfiCode) === InstrumentType.Bond)
        );
      }),
      shareReplay()
    );

    this.ob$ = combineLatest([settings$, this.themeService.getThemeSettings()]).pipe(
      tap(([,theme]) => { this.themeSettings = theme;}),
      switchMap(([settings,]) => this.service.getOrderBook(settings)),
      tap((ob) => (this.maxVolume = ob?.maxVolume ?? 1)),
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
      })
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
