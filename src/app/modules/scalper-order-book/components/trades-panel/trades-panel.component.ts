import { AfterViewInit, Component, DestroyRef, ElementRef, input, OnDestroy, OnInit, viewChild, inject } from '@angular/core';
import {BehaviorSubject, combineLatest, distinctUntilChanged, filter, Observable,} from 'rxjs';
import {ContentSize} from '../../../../shared/models/dashboard/dashboard-item.model';
import {color, ScaleLinear, scaleLinear} from 'd3';
import {ThemeService} from '../../../../shared/services/theme.service';
import {ThemeColors, ThemeSettings} from '../../../../shared/models/settings/theme-settings.model';
import {map} from 'rxjs/operators';
import {AllTradesItem} from '../../../../shared/models/all-trades.model';
import {ScalperOrderBookDataContext} from '../../models/scalper-order-book-data-context.model';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {CustomIteratorWrapper} from "../../../../shared/utils/array-iterators";
import {BodyRow} from "../../models/scalper-order-book.model";
import {TradesPanelSettings} from "../../models/scalper-order-book-settings.model";
import {AggregatedTrade, AggregatedTradesIterator} from "../../utils/aggregated-trades-iterator";
import {Side} from "../../../../shared/models/enums/side.model";
import {Trade} from "../../../../shared/models/trades/trade.model";
import {Position} from "../../../../shared/models/positions/position.model";
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';

interface LayerDrawer {
  zIndex: number;
  draw: () => void;
}

interface DrewItemMeta {
  xLeft: number;

  xRight: number;

  yTop: number;

  yBottom: number;

  connectionColor: string;
}

interface TradeDisplay {
  rowMinIndex: number;

  rowMaxIndex: number;

  volume: number;

  color: 'red' | 'green';
}

@Component({
  selector: 'ats-trades-panel',
  templateUrl: './trades-panel.component.html',
  styleUrls: ['./trades-panel.component.less'],
  imports: [NzResizeObserverDirective]
})
export class TradesPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly themeService = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  readonly xAxisStep = input.required<number>();

  readonly dataContext = input.required<ScalperOrderBookDataContext>();

  private readonly zIndexes = {
    gridLines: 0,
    item: 15,
    itemsConnector: 10,
    ownTrade: 5,
  };

  private readonly tradeItemFontSettings = {
    fontFace: 'Arial',
    fontSize: 10
  };

  private readonly margins = {
    tradePoint: {
      text: {
        left: 2,
        right: 2
      }
    }
  };

  private readonly contentSize$ = new BehaviorSubject<ContentSize>({width: 0, height: 0});
  private displayPriceItems$!: Observable<BodyRow[]>;

  ngAfterViewInit(): void {
    const panelSettings$ = this.dataContext().extendedSettings$.pipe(
      map(s => s.widgetSettings.tradesPanelSettings),
      map(s => s ?? ({
        minTradeVolumeFilter: 0,
        hideFilteredTrades: false,
        tradesAggregationPeriodMs: 0
      } as TradesPanelSettings)),
      distinctUntilChanged((prev, curr) => {
        return prev.minTradeVolumeFilter === curr.minTradeVolumeFilter
          && prev.hideFilteredTrades === curr.hideFilteredTrades
          && prev.tradesAggregationPeriodMs === curr.tradesAggregationPeriodMs;
      })
    );

    const sortedTrades$ = this.dataContext().trades$.pipe(
      map((trades) => {
        // order may be disturbed. https://github.com/alor-broker/Astras-Trading-UI/issues/1833
        return trades.sort((a, b) => a.timestamp - b.timestamp);
      })
    );

    combineLatest({
      size: this.contentSize$,
      priceItems: this.displayPriceItems$,
      allTrades: sortedTrades$,
      ownTrades: this.dataContext().ownTrades$,
      position: this.dataContext().position$,
      panelSettings: panelSettings$,
      themeSettings: this.themeService.getThemeSettings()
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      const canvas = this.canvas()?.nativeElement!;
      const context = canvas.getContext('2d')!;

      context.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = x.size!.width;
      canvas.height = x.priceItems.length * this.xAxisStep();

      this.draw(
        canvas,
        x.themeSettings,
        x.panelSettings,
        x.priceItems,
        x.allTrades,
        x.ownTrades,
        x.position
      );
    });
  }

  sizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  ngOnDestroy(): void {
    this.contentSize$.complete();
  }

  ngOnInit(): void {
    this.displayPriceItems$ = combineLatest([
      this.dataContext().orderBookBody$,
      this.dataContext().displayRange$
    ]).pipe(
      filter(([, displayRange]) => !!displayRange),
      map(([body, displayRange]) => {
        return body
          .slice(displayRange!.start, Math.min(displayRange!.end + 1, body.length));
      }),
      filter(priceItems => priceItems.length > 0),
    );
  }

  private draw(
    canvas: HTMLCanvasElement,
    themeSettings: ThemeSettings,
    panelSettings: TradesPanelSettings,
    priceItems: BodyRow[],
    allTrades: AllTradesItem[],
    ownTrades: Trade[],
    position: Position | null
  ): void {
    const context = canvas.getContext('2d')!;
    const xScale = scaleLinear([0, canvas.width])
      .domain([0, canvas.width]);
    const yScale = scaleLinear([0, canvas.height])
      .domain([0, priceItems.length]);

    let layers: LayerDrawer[] = [
      this.drawGridLines(priceItems, xScale, yScale, context, themeSettings.themeColors)
    ];

    if (panelSettings.showOwnTrades ?? false) {
      layers = [
        ...layers,
        ...this.drawOwnTrades(
          priceItems,
          this.filterOwnTrades(ownTrades, position),
          xScale,
          yScale,
          context,
          themeSettings.themeColors
        )
      ];
    }

    const itemsDraws: LayerDrawer[] = [];
    let prevItem: DrewItemMeta | null = null;
    for (const trade of new CustomIteratorWrapper(() => new AggregatedTradesIterator(allTrades, panelSettings.tradesAggregationPeriodMs))) {
      if (trade == null) {
        continue;
      }

      const currentItem = this.drawTrade(
        trade,
        priceItems,
        prevItem,
        xScale,
        yScale,
        context,
        panelSettings,
        themeSettings.themeColors
      );

      if (currentItem == null) {
        continue;
      }

      if (currentItem.meta.xRight < 0) {
        break;
      }

      itemsDraws.push(currentItem.drawer);

      if (!!prevItem) {
        layers.push(this.drawItemsConnection(
          currentItem.meta,
          prevItem,
          prevItem.connectionColor,
          context
        ));
      }

      prevItem = currentItem.meta;
    }

    layers = [
      ...layers,
      ...itemsDraws.reverse()
    ];

    layers
      .sort((a, b) => {
        if (a.zIndex < b.zIndex) {
          return -1;
        }

        if (a.zIndex > b.zIndex) {
          return 1;
        }

        return 0;
      })
      .forEach(x => x.draw());
  }

  private drawTrade(
    trade: AggregatedTrade,
    priceItems: BodyRow[],
    prevItem: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    panelSettings: TradesPanelSettings,
    themeColors: ThemeColors,): { meta: DrewItemMeta, drawer: LayerDrawer } | null {
    let mappedMinPriceIndex = -1;
    let mappedMaxPriceIndex = -1;

    const isFiltered = trade.volume < panelSettings.minTradeVolumeFilter;

    for (let index = 0; index < priceItems.length; index++) {
      const priceRow = priceItems[index];
      if (trade.minPrice >= priceRow.baseRange.min && trade.minPrice <= priceRow.baseRange.max) {
        mappedMinPriceIndex = index;
      }

      if (trade.maxPrice >= priceRow.baseRange.min && trade.maxPrice <= priceRow.baseRange.max) {
        mappedMaxPriceIndex = index;
      }

      if (mappedMinPriceIndex >= 0 && mappedMaxPriceIndex >= 0) {
        break;
      }
    }

    const tradeDisplay: TradeDisplay = {
      rowMinIndex: mappedMinPriceIndex,
      rowMaxIndex: mappedMaxPriceIndex,
      color: trade.side === Side.Buy ? 'green' : 'red',
      volume: trade.volume
    };

    let currentItem: { meta: DrewItemMeta, drawer: LayerDrawer } | null;

    if (tradeDisplay.rowMaxIndex >= 0 || tradeDisplay.rowMinIndex >= 0) {
      if (isFiltered) {
        currentItem = this.drawFilteredItem(
          tradeDisplay,
          prevItem,
          xScale,
          yScale,
          context,
          themeColors,
          panelSettings.hideFilteredTrades,
          false
        );
      } else {
        currentItem = this.drawInnerItem(
          tradeDisplay,
          prevItem,
          xScale,
          yScale,
          context,
          themeColors,
          false
        );
      }
    } else if (trade.minPrice < priceItems[0].baseRange.max && trade.maxPrice > priceItems[priceItems.length - 1].baseRange.min) {
      const correctedTrade = {
        ...tradeDisplay,
        rowMinIndex: this.getNearestPriceIndex(trade.minPrice, priceItems),
        rowMaxIndex: this.getNearestPriceIndex(trade.maxPrice, priceItems),
      };

      if (isFiltered) {
        currentItem = this.drawFilteredItem(
          correctedTrade,
          prevItem,
          xScale,
          yScale,
          context,
          themeColors,
          panelSettings.hideFilteredTrades,
          true
        );
      } else {
        currentItem = this.drawInnerItem(
          correctedTrade,
          prevItem,
          xScale,
          yScale,
          context,
          themeColors,
          true
        );
      }
    } else {
      const rowIndex = trade.minPrice > priceItems[0].baseRange.max
        ? 0
        : priceItems.length;

      currentItem = this.drawOuterItem(
        tradeDisplay,
        rowIndex,
        prevItem,
        xScale,
        yScale,
        context,
        themeColors
      );
    }

    return currentItem;
  }

  private getNearestPriceIndex(tradePrice: number, priceItems: BodyRow[]): number {
    let index = 0;
    for (let i = priceItems.length - 1; i >= 0; i--) {
      if (tradePrice < priceItems[i].baseRange.min) {
        break;
      }

      index = i;
    }

    return index;
  }

  private drawItemsConnection(
    item1Meta: DrewItemMeta,
    item2Meta: DrewItemMeta,
    color: string,
    context: CanvasRenderingContext2D
  ): LayerDrawer {
    return {
      zIndex: this.zIndexes.itemsConnector,
      draw: (): void => {
        this.resetContext(context);
        context.beginPath();
        context.moveTo(this.getMetaCenterX(item1Meta)!, this.getMetaCenterY(item1Meta)!);
        context.lineTo(this.getMetaCenterX(item2Meta)!, this.getMetaCenterY(item2Meta)!);
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.stroke();
      }
    };
  }

  private drawInnerItem(
    item: TradeDisplay,
    prevItemMeta: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors,
    isGhostTrade: boolean
  ): { meta: DrewItemMeta, drawer: LayerDrawer } {
    const rowMinIndex = item.rowMinIndex >= 0 ? item.rowMinIndex : item.rowMaxIndex;
    const rowMaxIndex = item.rowMaxIndex >= 0 ? item.rowMaxIndex : item.rowMinIndex;

    const prevLeftX = prevItemMeta?.xLeft ?? xScale(xScale.domain()[1]);
    const yTop = yScale(rowMaxIndex);
    const yBottom = yScale(rowMinIndex) + this.xAxisStep();

    const itemText = item.volume.toString();
    context.textBaseline = 'middle';
    context.font = `${this.tradeItemFontSettings.fontSize}px ${this.tradeItemFontSettings.fontFace}`;
    const textMetrics = context.measureText(itemText);
    const textWidth = Math.ceil(textMetrics.width);
    const textMargins = this.margins.tradePoint.text.left + this.margins.tradePoint.text.right;

    const itemWidth = Math.max(textWidth + textMargins, textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent, this.xAxisStep());
    let xRight = prevItemMeta != null
      ? Math.floor(prevItemMeta.xLeft + (prevItemMeta.xRight - prevItemMeta.xLeft) / 2)
      : xScale(xScale.domain()[1]);

    if ((xRight - itemWidth / 2) > prevLeftX) {
      xRight = Math.floor(prevLeftX + itemWidth / 2);
    }

    const xRadius = Math.ceil(itemWidth / 2);
    const xCenter = Math.floor(xRight - xRadius);
    const yCenter = Math.floor(yTop + ((yBottom - yTop) / 2));
    const yRadius = Math.max(xRadius, Math.ceil((yBottom - yTop) / 2));

    const draw = (): void => {
      this.resetContext(context);
      context.beginPath();
      context.ellipse(xCenter, yCenter, xRadius, yRadius, 0, 0, 2 * Math.PI);
      context.fillStyle = isGhostTrade
        ? themeColors.componentBackground
        : (item.color === 'green' ? themeColors.buyColor : themeColors.sellColor);
      context.fill();

      context.strokeStyle = isGhostTrade
        ? (item.color === 'green' ? themeColors.buyColor : themeColors.sellColor)
        : themeColors.textMaxContrastColor;
      context.stroke();

      context.fillStyle = isGhostTrade
        ? themeColors.textColor
        : themeColors.buySellBtnTextColor;
      context.textAlign = 'center';
      context.fillText(itemText, xCenter, yCenter);
    };

    return {
      drawer: {
        zIndex: this.zIndexes.item,
        draw
      },
      meta: {
        xLeft: Math.floor(xCenter - xRadius),
        xRight: Math.ceil(xCenter + xRadius),
        yTop,
        yBottom,
        connectionColor: item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground,
      }
    };
  }

  private drawFilteredItem(
    item: TradeDisplay,
    prevItemMeta: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors,
    isHidden: boolean,
    isGhostTrade: boolean
  ): { meta: DrewItemMeta, drawer: LayerDrawer } {
    const rowMinIndex = item.rowMinIndex >= 0 ? item.rowMinIndex : item.rowMaxIndex;
    const rowMaxIndex = item.rowMaxIndex >= 0 ? item.rowMaxIndex : item.rowMinIndex;

    const prevLeftX = prevItemMeta?.xLeft ?? (xScale(xScale.domain()[1]) - 1);
    const yTop = yScale(rowMaxIndex);
    const yBottom = yScale(rowMinIndex) + this.xAxisStep();

    const itemWidth = Math.max(4, Math.round(this.xAxisStep() / 2));
    const xLeft = Math.floor(prevLeftX - itemWidth);
    const itemHeight = rowMinIndex === rowMaxIndex
      ? itemWidth
      : Math.floor(yBottom - yTop);

    const itemTopY = rowMinIndex === rowMaxIndex
      ? Math.ceil(yTop + (this.xAxisStep() / 2) - (itemHeight / 2))
      : yTop;

    const draw = (): void => {
      if (isHidden) {
        return;
      }
      this.resetContext(context);
      context.beginPath();
      context.roundRect(
        this.getCanvasPx(xLeft),
        this.getCanvasPx(itemTopY),
        Math.floor(itemWidth),
        Math.floor(itemHeight),
        [2]
      );

      context.fillStyle = isGhostTrade
        ? themeColors.componentBackground
        : (item.color === 'green' ? themeColors.buyColor : themeColors.sellColor);
      context.fill();

      context.strokeStyle = isGhostTrade
        ? (item.color === 'green' ? themeColors.buyColor : themeColors.sellColor)
        : themeColors.textMaxContrastColor;
      context.stroke();
    };

    return {
      drawer: {
        zIndex: this.zIndexes.item,
        draw
      },
      meta: {
        xLeft: xLeft,
        xRight: Math.ceil(xLeft + itemWidth),
        yTop,
        yBottom,
        connectionColor: item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground,
      }
    };
  }

  private getCanvasPx(value: number, needBlurCorrection = true): number {
    const rounded = Math.round(value);
    if (!needBlurCorrection) {
      return rounded;
    }

    // https://usefulangle.com/post/17/html5-canvas-drawing-1px-crisp-straight-lines
    const correction = rounded > Math.floor(value)
      ? -0.5
      : 0.5;

    return rounded + correction;
  }

  private drawOuterItem(
    item: TradeDisplay,
    rowIndex: number,
    prevItemMeta: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors
  ): { meta: DrewItemMeta, drawer: LayerDrawer } {
    const prevLeftX = prevItemMeta?.xLeft ?? xScale(xScale.domain()[1]);
    const xRight = Math.floor(prevLeftX - this.xAxisStep());

    const yTop = yScale(rowIndex);
    const yBottom = yTop + this.xAxisStep();

    const xRadius = Math.ceil(this.xAxisStep() / 2);
    const xCenter = Math.floor(xRight - xRadius);
    const yCenter = Math.floor(yTop + ((yBottom - yTop) / 2));
    const yRadius = Math.max(xRadius, Math.ceil((yBottom - yTop) / 2));

    const draw = (): void => {
      this.resetContext(context);
      context.beginPath();
      context.ellipse(xCenter, yCenter, xRadius, yRadius, 0, 0, 2 * Math.PI);
      context.strokeStyle = item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground;
      context.stroke();
    };

    return {
      drawer: {
        zIndex: this.zIndexes.item,
        draw
      },
      meta: {
        xLeft: Math.floor(xRight - this.xAxisStep()),
        xRight,
        yTop,
        yBottom,
        connectionColor: item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground
      }
    };
  }

  private drawGridLines(
    priceItems: BodyRow[],
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors): LayerDrawer {
    const draw = (): void => {
      const yRowOffset = Math.ceil(this.xAxisStep() / 2);

      for (let i = 0; i < priceItems.length; i++) {
        const priceRow = priceItems[i];
        if (priceRow.isMinorLinePrice || priceRow.isMajorLinePrice) {
          this.resetContext(context);
          context.beginPath();
          // plus 0.5 to fix line width. See https://stackoverflow.com/a/13879402
          const y = this.getCanvasPx(yScale(i) + yRowOffset, !priceRow.isMajorLinePrice);
          context.moveTo(xScale(0), y);
          context.lineTo(xScale(xScale.domain()[1]), y);
          context.strokeStyle = themeColors.tableGridColor;
          context.lineWidth = priceRow.isMajorLinePrice ? 2 : 1;
          context.stroke();
        }
      }
    };

    return {
      zIndex: this.zIndexes.gridLines,
      draw
    };
  }

  private getMetaCenterX(item: DrewItemMeta | null): number | null {
    if (!item) {
      return null;
    }

    return this.getCenter(item.xLeft, item.xRight);
  }

  private getMetaCenterY(item: DrewItemMeta | null): number | null {
    if (!item) {
      return null;
    }

    return this.getCenter(item.yTop, item.yBottom);
  }

  private getCenter(start: number, end: number): number {
    return start + (end - start) / 2;
  }

  private drawOwnTrades(
    priceItems: BodyRow[],
    trades: Trade[],
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors
  ): LayerDrawer[] {
    const drawers: LayerDrawer[] = [];

    const drawTrade = (priceIndex: number, volume: number, side: Side, right: number | null): number => {
      const yTop = yScale(priceIndex);
      const itemText = volume.toString();
      context.textBaseline = 'middle';
      context.font = `${this.tradeItemFontSettings.fontSize}px ${this.tradeItemFontSettings.fontFace}`;
      const textMetrics = context.measureText(itemText);
      const textWidth = Math.ceil(textMetrics.width);
      const textMargins = this.margins.tradePoint.text.left + this.margins.tradePoint.text.right;
      const itemWidth = Math.max(textWidth + textMargins, textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent, this.xAxisStep());
      const xRight = right ?? (xScale(xScale.domain()[1]) - 1);
      const xLeft = Math.floor(xRight - itemWidth);
      const itemHeight = Math.floor(this.xAxisStep());

      this.resetContext(context);
      context.beginPath();
      context.roundRect(
        this.getCanvasPx(xLeft),
        this.getCanvasPx(yTop),
        Math.round(itemWidth),
        Math.round(itemHeight),
        [2]
      );

      const backgroundColor = color(side === Side.Buy
        ? themeColors.buyColorAccent
        : themeColors.sellColorAccent
      );

      if (!!backgroundColor) {
        backgroundColor.opacity = 0.65;
      }

      context.fillStyle = backgroundColor?.formatRgb() ?? themeColors.componentBackground;
      context.fill();

      context.strokeStyle = themeColors.textColor;
      context.stroke();

      context.fillStyle = themeColors.textMaxContrastColor;
      context.textAlign = 'center';
      context.fillText(itemText, this.getCenter(xLeft, xRight), this.getCenter(yTop, yTop + itemHeight));

      return xLeft;
    };

    for (const trade of this.getAggregatedTrades(trades, priceItems)) {
      let prevLeft: number | null = null;

      drawers.push({
        draw: () => {
          if (trade.sellVolume !== 0) {
            prevLeft = drawTrade(trade.priceIndex, trade.sellVolume, Side.Sell, null) - 2;
          }

          if (trade.buyVolume !== 0) {
            drawTrade(trade.priceIndex, trade.buyVolume, Side.Buy, prevLeft);
          }
        },
        zIndex: this.zIndexes.ownTrade
      });
    }

    return drawers;
  }

  private filterOwnTrades(trades: Trade[], position: Position | null): Trade[] {
    if (position == null) {
      return [];
    }

    const sortedTrades = [...trades].sort((a, b) => b.date.getTime() - a.date.getTime());
    const filteredTrades: Trade[] = [];
    let rest = position.qtyTFuture;
    for (const trade of sortedTrades) {
      const tradeQty = trade.side === Side.Buy
        ? -trade.qty
        : trade.qty;
      rest += tradeQty;

      filteredTrades.push(trade);

      if (Math.round(rest) === 0) {
        break;
      }
    }

    return filteredTrades;
  }

  private getAggregatedTrades(trades: Trade[], priceItems: BodyRow[]): {
    priceIndex: number;
    buyVolume: number;
    sellVolume: number;
  }[] {
    const aggregatedTrades = new Map<number, { buyVolume: number, sellVolume: number }>();

    for (const trade of trades) {
      let priceIndex = priceItems.findIndex(p => trade.price >= p.baseRange.min && trade.price <= p.baseRange.max);

      if (priceIndex === -1) {
        if (trade.price < priceItems[0].baseRange.max && trade.price > priceItems[priceItems.length - 1].baseRange.min) {
          priceIndex = this.getNearestPriceIndex(trade.price, priceItems);
        } else {
          continue;
        }
      }

      const item = {
        buyVolume: trade.side === Side.Buy ? trade.qtyBatch : 0,
        sellVolume: trade.side === Side.Sell ? trade.qtyBatch : 0,
      };

      const existedItem = aggregatedTrades.get(priceIndex);

      aggregatedTrades.set(
        priceIndex,
        {
          buyVolume: (existedItem?.buyVolume ?? 0) + item.buyVolume,
          sellVolume: (existedItem?.sellVolume ?? 0) + item.sellVolume,
        }
      );
    }

    return Array.from(aggregatedTrades)
      .map(([key, value]) => ({
        priceIndex: key,
        buyVolume: value.buyVolume,
        sellVolume: value.sellVolume
      }));
  }

  private resetContext(context: CanvasRenderingContext2D): void {
    context.closePath();
    context.lineWidth = 1;
  }
}
