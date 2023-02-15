import {
  AfterViewInit,
  Component,
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
  takeUntil
} from 'rxjs';
import { ContentSize } from '../../../../shared/models/dashboard/dashboard-item.model';
import { Destroyable } from '../../../../shared/utils/destroyable';
import { TradeDisplay } from '../../models/trade-display.model';
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

  type: string;
}

@Component({
  selector: 'ats-trades-panel[xAxisStep][dataContext]',
  templateUrl: './trades-panel.component.html',
  styleUrls: ['./trades-panel.component.less']
})
export class TradesPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas')
  canvas?: ElementRef<HTMLCanvasElement>;
  @Input()
  xAxisStep!: number;

  @Input()
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

  private readonly destroyable = new Destroyable();
  private readonly contentSize$ = new BehaviorSubject<ContentSize>({ width: 0, height: 0 });
  private displayPriceItems$!: Observable<number[]>;

  constructor(private readonly themeService: ThemeService) {
  }

  ngAfterViewInit(): void {

    combineLatest([
      this.contentSize$,
      this.displayPriceItems$,
      this.getTradesStream(),
      this.themeService.getThemeSettings()
    ]).pipe(
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(([size, priceItems, trades, themeSettings]) => {
      const canvas = this.canvas?.nativeElement!;
      const context = canvas.getContext('2d')!;

      context.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = size!.width;
      canvas.height = priceItems.length * this.xAxisStep;

      this.draw(canvas, priceItems.length, themeSettings, this.getDisplayTrades(priceItems, trades));
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
    this.destroyable.destroy();
    this.contentSize$.complete();
  }

  ngOnInit(): void {
    this.displayPriceItems$ = combineLatest([
      this.dataContext.orderBookBody$,
      this.dataContext.displayRange$
    ]).pipe(
      filter(([, displayRange]) => !!displayRange),
      map(([body, displayRange]) => {
        return body.bodyRows
          .slice(displayRange!.start, Math.min(displayRange!.end + 1, body.bodyRows.length))
          .map(x => x.price);
      })
    );
  }

  private getDisplayTrades(priceRows: number[], trades: AllTradesItem[]): TradeDisplay[] {
    const displayTrades: TradeDisplay[] = [];
    trades.forEach(trade => {
      const matchedRowIndex = priceRows.indexOf(trade.price);
      if (matchedRowIndex >= 0) {
        displayTrades.push({
          rowIndex: matchedRowIndex,
          color: trade.side === 'buy' ? 'green' : 'red',
          volume: trade.qty,
          showVolume: true
        });
      }
    });

    return displayTrades;
  }

  private getTradesStream(): Observable<AllTradesItem[]> {
    return this.dataContext.trades$.pipe(
      map(x => x.slice(-1000))
    );
  }

  private draw(
    canvas: HTMLCanvasElement,
    rowsCount: number,
    themeSettings: ThemeSettings,
    data: TradeDisplay[]
  ) {
    const context = canvas.getContext('2d')!;
    const xScale = scaleLinear([0, canvas.width])
      .domain([0, canvas.width]);
    const yScale = scaleLinear([0, canvas.height])
      .domain([0, rowsCount]);

    let layers: LayerDrawer[] = [];

    layers.push(this.drawGridLines(rowsCount, xScale, yScale, context, themeSettings.themeColors));

    const itemsDraws: LayerDrawer[] = [];
    let prevItem: DrewItemMeta | null = null;
    [...data].reverse().every(d => {
      const currentItem = this.drawTradeItem(
        d,
        prevItem,
        xScale,
        yScale,
        context,
        themeSettings.themeColors);

      if (currentItem.meta.xRight < 0) {
        return false;
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

      return true;
    });

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
    const itemType = 'volume';

    const prevLeftBound = prevItemMeta?.xLeft ?? xScale(xScale.domain()[1]);
    const yTop = yScale(item.rowIndex) + this.margins.tradePoint.top;
    const yBottom = yScale(item.rowIndex) + this.xAxisStep - this.margins.tradePoint.bottom;
    let xRight = prevLeftBound - this.margins.tradePoint.itemsGap;

    if (!!prevItemMeta && this.getMetaCenterY(prevItemMeta) !== this.getCenter(yTop, yBottom)) {
      xRight = this.getMetaCenterX(prevItemMeta)! - this.margins.tradePoint.itemsGap;
    }

    context.font = `${this.tradeItemFontSettings.fontSize}px ${this.tradeItemFontSettings.fontFace}`;
    const itemText = item.volume.toString();
    const textMetrics = context.measureText(itemText);
    const textWidth = Math.ceil(textMetrics.width);
    const textMargins = this.margins.tradePoint.text.left + this.margins.tradePoint.text.right;

    const itemHeight = yBottom - yTop;
    let itemWidth = Math.max(itemHeight, textWidth);
    const marginDiff = itemWidth - textWidth;
    if (marginDiff < textMargins) {
      itemWidth = itemWidth + textMargins - marginDiff;
    }

    const xLeft = xRight - itemWidth;
    const xCenter = xLeft + itemWidth / 2;
    const yCenter = yTop + (itemHeight / 2);

    const draw = () => {
      context.fillStyle = item.color === 'green' ? themeColors.buyColor : themeColors.sellColor;
      this.drawRoundedRect(xLeft, yTop, itemWidth, itemHeight, 2, context);
      context.fill();
      context.fillStyle = themeColors.chartPrimaryTextColor;
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
        xLeft,
        xRight,
        yTop,
        yBottom,
        connectionColor: item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground,
        type: itemType
      }
    };
  }

  private drawItemAsPoint(
    item: TradeDisplay,
    prevItemMeta: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors
  ): { meta: DrewItemMeta, drawer: LayerDrawer } {
    const itemType = 'point';

    const prevLeftBound = prevItemMeta?.xLeft ?? xScale(xScale.domain()[1]);

    const yTop = yScale(item.rowIndex) + this.margins.tradePoint.top;
    const yBottom = yScale(item.rowIndex) + this.xAxisStep - this.margins.tradePoint.bottom;
    const pointRadius = Math.round((yBottom - yTop) / 3);
    const centerY = yTop + (yBottom - yTop) / 2;

    let xRight = prevLeftBound - this.margins.tradePoint.itemsGap;
    if (prevItemMeta && (prevItemMeta.type === itemType || this.getMetaCenterY(prevItemMeta) !== centerY)) {
      xRight = xRight + pointRadius;
    }

    const centerX = xRight - pointRadius;

    const draw = () => {
      context.beginPath();
      context.arc(centerX, centerY, pointRadius, 0, 2 * Math.PI, false);
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
        xLeft: xRight - (pointRadius * 2),
        xRight: xRight,
        yTop: centerY - pointRadius,
        yBottom: centerY + pointRadius,
        connectionColor: item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground,
        type: itemType
      }
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

  private drawTradeItem(
    item: TradeDisplay,
    prevItemMeta: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors): { meta: DrewItemMeta, drawer: LayerDrawer } {

    if (item.showVolume) {
      return this.drawItemWithVolume(item, prevItemMeta, xScale, yScale, context, themeColors);

    }

    return this.drawItemAsPoint(item, prevItemMeta, xScale, yScale, context, themeColors);
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
