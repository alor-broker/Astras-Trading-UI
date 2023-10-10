import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  Observable,
} from 'rxjs';
import { ContentSize } from '../../../../shared/models/dashboard/dashboard-item.model';
import {
  ScaleLinear,
  scaleLinear
} from 'd3';
import { ThemeService } from '../../../../shared/services/theme.service';
import {
  ThemeColors,
  ThemeSettings
} from '../../../../shared/models/settings/theme-settings.model';
import { map } from 'rxjs/operators';
import { AllTradesItem } from '../../../../shared/models/all-trades.model';
import { ScalperOrderBookDataContext } from '../../models/scalper-order-book-data-context.model';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  ArrayReverseIterator,
  CustomIteratorWrapper
} from "../../../../shared/utils/array-iterators";

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
  rowIndex: number;

  volume: number;

  color: 'red' | 'green';
}

interface ItemMeasurements {
  xLeft: number;
  xRight: number;
  yTop: number;
  yBottom: number;
}

@Component({
  selector: 'ats-trades-panel',
  templateUrl: './trades-panel.component.html',
  styleUrls: ['./trades-panel.component.less']
})
export class TradesPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas')
  canvas?: ElementRef<HTMLCanvasElement>;

  @Input({ required: true })
  xAxisStep!: number;

  @Input({ required: true })
  dataContext!: ScalperOrderBookDataContext;

  private readonly zIndexes = {
    gridLines: 0,
    item: 10,
    itemsConnector: 5
  };

  private readonly tradeItemFontSettings = {
    fontFace: 'Arial',
    fontSize: 10
  };

  private readonly margins = {
    tradePoint: {
      top: 3,
      bottom: 3,
      itemsGap: 2,
      text: {
        left: 2,
        right: 2
      }
    }
  };

  private readonly contentSize$ = new BehaviorSubject<ContentSize>({ width: 0, height: 0 });
  private displayPriceItems$!: Observable<number[]>;

  constructor(
    private readonly themeService: ThemeService,
    private readonly destroyRef: DestroyRef) {
  }

  ngAfterViewInit(): void {

    combineLatest([
      this.contentSize$,
      this.displayPriceItems$,
      this.dataContext.trades$,
      this.themeService.getThemeSettings()
    ]).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([size, priceItems, trades, themeSettings]) => {
      const canvas = this.canvas?.nativeElement!;
      const context = canvas.getContext('2d')!;

      context.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = size!.width;
      canvas.height = priceItems.length * this.xAxisStep;

      this.draw(
        canvas,
        themeSettings,
        priceItems,
        trades
      );
    });
  }

  sizeChanged(entries: ResizeObserverEntry[]) {
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
      this.dataContext.orderBookBody$,
      this.dataContext.displayRange$
    ]).pipe(
      filter(([, displayRange]) => !!displayRange),
      map(([body, displayRange]) => {
        return body
          .slice(displayRange!.start, Math.min(displayRange!.end + 1, body.length))
          .map(x => x.price);
      })
    );
  }

  private draw(
    canvas: HTMLCanvasElement,
    themeSettings: ThemeSettings,
    priceItems: number[],
    orderedTrades: AllTradesItem[]
  ) {
    const context = canvas.getContext('2d')!;
    const xScale = scaleLinear([0, canvas.width])
      .domain([0, canvas.width]);
    const yScale = scaleLinear([0, canvas.height])
      .domain([0, priceItems.length]);

    let layers: LayerDrawer[] = [];

    layers.push(this.drawGridLines(priceItems.length, xScale, yScale, context, themeSettings.themeColors));

    const itemsDraws: LayerDrawer[] = [];
    let prevItem: DrewItemMeta | null = null;
    for (const trade of new CustomIteratorWrapper(() => new ArrayReverseIterator(orderedTrades))) {

      const currentItem = this.drawTrade(
        trade,
        priceItems,
        prevItem,
        xScale,
        yScale,
        context,
        themeSettings.themeColors
      );

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
    trade: AllTradesItem,
    priceItems: number[],
    prevItem: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors): { meta: DrewItemMeta, drawer: LayerDrawer } {
    const mappedPriceIndex = priceItems.indexOf(trade.price);
    const tradeDisplay: TradeDisplay = {
      rowIndex: mappedPriceIndex,
      color: trade.side === 'buy' ? 'green' : 'red',
      volume: trade.qty
    };

    let currentItem: { meta: DrewItemMeta, drawer: LayerDrawer };
    if (mappedPriceIndex < 0) {
      if (trade.price < priceItems[0] && trade.price > priceItems[priceItems.length - 1]) {
        currentItem = this.drawMissingPriceItem(
          {
            ...tradeDisplay,
            rowIndex: this.getNearestPriceIndex(trade, priceItems)
          },
          prevItem,
          xScale,
          yScale,
          context,
          themeColors
        );
      } else {
        currentItem = this.drawOuterItem(
          {
            ...tradeDisplay,
            rowIndex: trade.price > priceItems[0]
              ? 0
              : priceItems.length
          },
          prevItem,
          xScale,
          yScale,
          context,
          themeColors
        );
      }

    } else {
      currentItem = this.drawItemWithVolume(
        tradeDisplay,
        prevItem,
        xScale,
        yScale,
        context,
        themeColors
      );
    }

    return currentItem;
  }

  private getNearestPriceIndex(trade: AllTradesItem, priceItems: number[]): number {
    let index = 0;
    for (let i = priceItems.length - 1; i >= 0; i--) {
      if (trade.price < priceItems[i]) {
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
      draw: () => {
        context.beginPath();
        context.moveTo(this.getMetaCenterX(item1Meta)!, this.getMetaCenterY(item1Meta)!);
        context.lineTo(this.getMetaCenterX(item2Meta)!, this.getMetaCenterY(item2Meta)!);
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.stroke();
      }
    };
  }

  private drawItemWithVolume(
    item: TradeDisplay,
    prevItemMeta: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors
  ): { meta: DrewItemMeta, drawer: LayerDrawer } {

    const itemText = item.volume.toString();
    const itemMeasurements = this.getItemWithVolumeMeasurements(
      itemText,
      item.rowIndex,
      prevItemMeta,
      xScale,
      yScale,
      context
    );

    const itemWidth = itemMeasurements.xRight - itemMeasurements.xLeft;
    const itemHeight = itemMeasurements.yBottom - itemMeasurements.yTop;
    const xCenter = itemMeasurements.xLeft + itemWidth / 2;
    const yCenter = itemMeasurements.yTop + (itemHeight / 2);

    const draw = () => {
      context.fillStyle = item.color === 'green' ? themeColors.buyColor : themeColors.sellColor;
      this.drawRoundedRect(itemMeasurements.xLeft, itemMeasurements.yTop, itemWidth, itemHeight, 2, context);
      context.fill();
      context.fillStyle = themeColors.buySellLabelColor;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(itemText, xCenter, yCenter);
    };

    return {
      drawer: {
        zIndex: this.zIndexes.item,
        draw
      },
      meta: {
        xLeft: itemMeasurements.xLeft,
        xRight: itemMeasurements.xRight,
        yTop: itemMeasurements.yTop,
        yBottom: itemMeasurements.yBottom,
        connectionColor: item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground,
      }
    };
  }

  private drawMissingPriceItem(
    item: TradeDisplay,
    prevItemMeta: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors
  ): { meta: DrewItemMeta, drawer: LayerDrawer } {

    const itemText = item.volume.toString();
    const itemMeasurements = this.getItemWithVolumeMeasurements(
      itemText,
      item.rowIndex,
      prevItemMeta,
      xScale,
      yScale,
      context
    );

    const itemWidth = itemMeasurements.xRight - itemMeasurements.xLeft;
    const itemHeight = itemMeasurements.yBottom - itemMeasurements.yTop;
    const xCenter = itemMeasurements.xLeft + itemWidth / 2;
    const yCenter = itemMeasurements.yTop + (itemHeight / 2);

    const draw = () => {
      context.strokeStyle = item.color === 'green' ? themeColors.buyColor : themeColors.sellColor;
      this.drawRoundedRect(itemMeasurements.xLeft, itemMeasurements.yTop, itemWidth, itemHeight, 2, context);
      context.stroke();
      context.fillStyle = themeColors.buySellLabelColor;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(itemText, xCenter, yCenter);
    };

    return {
      drawer: {
        zIndex: this.zIndexes.item,
        draw
      },
      meta: {
        xLeft: itemMeasurements.xLeft,
        xRight: itemMeasurements.xRight,
        yTop: itemMeasurements.yTop,
        yBottom: itemMeasurements.yBottom,
        connectionColor: item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground
      }
    };
  }

  private drawOuterItem(
    item: TradeDisplay,
    prevItemMeta: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors
  ): { meta: DrewItemMeta, drawer: LayerDrawer } {
    const measurements = this.getItemWithVolumeMeasurements(
      item.volume.toString(),
      item.rowIndex,
      prevItemMeta,
      xScale,
      yScale,
      context
    );

    const x = measurements.xLeft + (measurements.xRight - measurements.xLeft) / 2;
    const y = yScale(item.rowIndex);

    const draw = () => {
      context.beginPath();
      context.arc(x, y, 2, 0, 2 * Math.PI, false);
      context.strokeStyle = item.color === 'green' ? themeColors.buyColor : themeColors.sellColor;
      context.fillStyle = item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground;
      context.stroke();
      context.fill();
    };

    return {
      drawer: {
        zIndex: this.zIndexes.item,
        draw
      },
      meta: {
        xLeft: measurements.xLeft,
        xRight: measurements.xRight,
        yTop: measurements.yTop,
        yBottom: measurements.yBottom,
        connectionColor: item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground
      }
    };
  }

  private getItemWithVolumeMeasurements(
    itemText: string,
    rowIndex: number,
    prevItemMeta: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D): ItemMeasurements {
    const prevLeftBound = prevItemMeta?.xLeft ?? xScale(xScale.domain()[1]);
    const yTop = yScale(rowIndex) + this.margins.tradePoint.top;
    const yBottom = yScale(rowIndex) + this.xAxisStep - this.margins.tradePoint.bottom;
    let xRight = prevLeftBound - this.margins.tradePoint.itemsGap;

    if (!!prevItemMeta && this.getMetaCenterY(prevItemMeta) !== this.getCenter(yTop, yBottom)) {
      xRight = this.getMetaCenterX(prevItemMeta)! - this.margins.tradePoint.itemsGap;
    }

    context.font = `${this.tradeItemFontSettings.fontSize}px ${this.tradeItemFontSettings.fontFace}`;
    const textMetrics = context.measureText(itemText);
    const textWidth = Math.ceil(textMetrics.width);
    const textMargins = this.margins.tradePoint.text.left + this.margins.tradePoint.text.right;

    const itemHeight = yBottom - yTop;
    let itemWidth = Math.max(itemHeight, textWidth);
    const marginDiff = itemWidth - textWidth;
    if (marginDiff < textMargins) {
      itemWidth = itemWidth + textMargins - marginDiff;
    }

    return {
      xLeft: xRight - itemWidth,
      xRight,
      yTop,
      yBottom
    };
  }

  private drawGridLines(
    rowsCount: number,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors): LayerDrawer {
    const draw = () => {
      for (let i = 5; i < rowsCount; i = i + 5) {
        context.beginPath();
        context.moveTo(xScale(0), yScale(i) - 0.5);
        context.lineTo(xScale(xScale.domain()[1]), yScale(i));
        context.strokeStyle = themeColors.chartGridColor;
        context.lineWidth = 1;
        context.stroke();
      }
    };

    return {
      zIndex: this.zIndexes.gridLines,
      draw
    };
  }

  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number, context: CanvasRenderingContext2D) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
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
}
