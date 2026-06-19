import {
  combineLatest,
  defer,
  distinctUntilChanged,
  finalize,
  Observable,
  of,
  shareReplay,
  switchScan,
  take
} from 'rxjs';
import {map} from 'rxjs/operators';
import {
  InstrumentEqualityComparer,
  InstrumentKeyHelper
} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {
  Instrument,
  InstrumentKey
} from '@terminal-core-lib/common/types/instrument.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';
import {
  OrderBook,
  ScalperOrderBookExtendedSettings
} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book-data-context.types';
import {ScalperOrderBookConstants} from '@terminal-widgets-lib/widgets/scalper-order-book/constants/scalper-order-book.constants';
import {ScalperOrderBookWidgetSettings} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {
  DisplayModel,
  PriceGridDescriptor
} from '@terminal-widgets-lib/widgets/scalper-order-book-2/render/price-grid/price-grid-types';
import {
  OrderBookBounds,
  PriceGridMath
} from '@terminal-widgets-lib/widgets/scalper-order-book-2/render/price-grid/price-grid-math';
import {DisplayModelBuilder} from '@terminal-widgets-lib/widgets/scalper-order-book-2/render/price-grid/display-model-builder';

export interface DisplayModelChangeNotifications {
  priceRowsRegenerationStarted(): void;

  priceRowsRegenerationCompleted(): void;
}

export interface DisplayModelStreamArgs {
  readonly settings$: Observable<ScalperOrderBookExtendedSettings>;
  readonly orderBook$: Observable<OrderBook>;
  readonly position$: Observable<Position | null>;
  readonly scaleFactor$: Observable<number>;
  readonly notifications: DisplayModelChangeNotifications;
}

export interface DisplayModelStreamDeps {
  readonly quotesService: QuotesService;
}

/** Аккумулятор «липкого» состояния сетки (стартовая цена фиксируется при анкоринге). */
interface GridState {
  instrumentKey: InstrumentKey | null;
  scaleFactor: number;
  descriptor: PriceGridDescriptor | null;
}

const SEED_STATE: GridState = {
  instrumentKey: null,
  scaleFactor: Number.NaN,
  descriptor: null
};

/**
 * Строит поток {@link DisplayModel} - лёгкую замену тяжёлого `orderBookBody$`.
 *
 * Сетка бесконечна, поэтому регенерация нужна только при смене инструмента/масштаба
 * и при первом получении ордербука (анкоринг стартовой цены). «Липкое» состояние
 * сетки несётся аккумулятором `switchScan` - отдельное хранилище не требуется.
 * Построение модели отображения - O(размера активной зоны).
 */
export class DisplayModelStreamBuilder {
  static build(args: DisplayModelStreamArgs, deps: DisplayModelStreamDeps): Observable<DisplayModel | null> {
    const descriptor$ = combineLatest([
      args.settings$,
      args.orderBook$,
      args.scaleFactor$
    ]).pipe(
      switchScan(
        (state: GridState, [settings, orderBook, scaleFactor]) =>
          this.reconcile(state, settings, orderBook, scaleFactor, args, deps),
        SEED_STATE
      ),
      map(state => state.descriptor),
      distinctUntilChanged(),
      shareReplay({bufferSize: 1, refCount: true})
    );

    return combineLatest([
      descriptor$,
      args.orderBook$,
      args.position$,
      args.settings$
    ]).pipe(
      map(([descriptor, orderBook, position, settings]) => {
        if (descriptor == null
          || !InstrumentEqualityComparer.equals(settings.widgetSettings, orderBook.instrumentKey)
          || !InstrumentEqualityComparer.equals(settings.widgetSettings, descriptor.instrumentKey)) {
          return null;
        }

        return DisplayModelBuilder.build(
          descriptor,
          orderBook.rows,
          position,
          {
            showZeroVolumeItems: settings.widgetSettings.showZeroVolumeItems ?? true,
            showSpreadItems: settings.widgetSettings.showSpreadItems ?? true
          }
        );
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  /**
   * Решает, нужна ли регенерация сетки. Сохраняет «липкое» состояние, перегенерируя
   * только при смене инструмента/масштаба и при появлении ордербука после анкоринга
   * по последней цене / при отсутствии данных.
   */
  private static reconcile(
    state: GridState,
    settings: ScalperOrderBookExtendedSettings,
    orderBook: OrderBook,
    scaleFactor: number,
    args: DisplayModelStreamArgs,
    deps: DisplayModelStreamDeps
  ): Observable<GridState> {
    const widgetSettings = settings.widgetSettings;
    const instrumentMatches = state.instrumentKey != null
      && InstrumentEqualityComparer.equals(widgetSettings, state.instrumentKey);
    const orderbookCorrect = InstrumentEqualityComparer.equals(widgetSettings, orderBook.instrumentKey);
    const bookHasData = orderbookCorrect && (orderBook.rows.a.length > 0 || orderBook.rows.b.length > 0);

    if (instrumentMatches && state.scaleFactor === scaleFactor) {
      // Перегенерация нужна, только если опорная сетка была дочерней по последней цене
      // (isDirty) или данных не было, а теперь пришёл ордербук.
      const needsBookAnchor = (state.descriptor == null || state.descriptor.isDirty) && bookHasData;
      if (!needsBookAnchor) {
        return of(state);
      }
    }

    return this.regenerate(widgetSettings, settings.instrument, orderBook, scaleFactor, orderbookCorrect, args, deps);
  }

  /** Считает границы (ордербук или последняя цена) и строит новое состояние сетки. */
  private static regenerate(
    widgetSettings: ScalperOrderBookWidgetSettings,
    instrument: Instrument,
    orderBook: OrderBook,
    scaleFactor: number,
    orderbookCorrect: boolean,
    args: DisplayModelStreamArgs,
    deps: DisplayModelStreamDeps
  ): Observable<GridState> {
    return defer(() => {
      args.notifications.priceRowsRegenerationStarted();

      let priceBounds$: Observable<OrderBookBounds | null> | null = null;
      if (orderbookCorrect) {
        const bounds = PriceGridMath.getOrderBookBounds(orderBook.rows);
        if (bounds.asksRange != null || bounds.bidsRange != null) {
          priceBounds$ = of(bounds);
        }
      }

      priceBounds$ ??= deps.quotesService.getLastPrice(widgetSettings, 1).pipe(
        map(lastPrice => {
          if (lastPrice != null) {
            return {
              asksRange: {min: lastPrice, max: lastPrice},
              bidsRange: {min: lastPrice, max: lastPrice}
            } as OrderBookBounds;
          }

          return null;
        })
      );

      return priceBounds$.pipe(
        take(1),
        map(bounds => ({
          instrumentKey: InstrumentKeyHelper.toInstrumentKey(widgetSettings),
          scaleFactor,
          descriptor: this.buildDescriptor(widgetSettings, instrument, bounds, scaleFactor)
        } as GridState)),
        finalize(() => args.notifications.priceRowsRegenerationCompleted())
      );
    });
  }

  private static buildDescriptor(
    widgetSettings: ScalperOrderBookWidgetSettings,
    instrument: Instrument,
    bounds: OrderBookBounds | null,
    scaleFactor: number
  ): PriceGridDescriptor | null {
    const priceOptions = PriceGridMath.getPriceOptions(
      bounds,
      instrument.minstep,
      scaleFactor,
      widgetSettings.majorLinesStep ?? ScalperOrderBookConstants.defaultMajorLinesStep
    );

    if (priceOptions == null) {
      return null;
    }

    return {
      instrumentKey: InstrumentKeyHelper.toInstrumentKey(widgetSettings),
      startPrice: priceOptions.startPrice,
      scaledStep: priceOptions.scaledStep,
      pricePrecision: MathHelper.getPrecision(priceOptions.scaledStep),
      basePriceStep: priceOptions.basePriceStep,
      scaleFactor: priceOptions.scaleFactor,
      minorLineValue: PriceGridMath.getMinorLineValue(priceOptions.scaledStep, widgetSettings.minorLinesStep),
      majorLineValue: PriceGridMath.getMajorLineValue(priceOptions.scaledStep, widgetSettings.majorLinesStep),
      // dirty, когда лучшие bid/ask совпадают (анкоринг по последней цене без спреда).
      isDirty: bounds == null || bounds.bidsRange?.max === bounds.asksRange?.min
    };
  }
}
