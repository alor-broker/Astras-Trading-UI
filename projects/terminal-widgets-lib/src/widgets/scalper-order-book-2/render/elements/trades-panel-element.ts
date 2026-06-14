import {
  BitmapText,
  Container,
  Graphics
} from 'pixi.js';
import {BodyRow} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {
  AggregatedTrade,
  AggregatedTradesIterator
} from '@terminal-widgets-lib/widgets/scalper-order-book/utils/aggregated-trades-iterator';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {CustomIteratorWrapper} from '@terminal-core-lib/common/utils/array.helper';
import {
  DirtyFlags,
  FillSpec,
  FontProvider,
  FrameContext,
  OwnTradeDisplay
} from '../render-contracts';
import {RenderElement} from './render-element';

/** Размер шрифта текста объема сделки (как в canvas-версии панели). */
const TRADE_ITEM_FONT_SIZE = 10;

/**
 * Приближенная высота строки шрифта 10px.
 * Заменяет fontBoundingBoxAscent + fontBoundingBoxDescent из canvas-версии.
 */
const FONT_LINE_HEIGHT_APPROX = 12;

/** Суммарные горизонтальные отступы текста внутри элемента сделки (2 слева + 2 справа). */
const TEXT_MARGINS = 4;

/** Радиус скругления прямоугольников отфильтрованных и собственных сделок. */
const RECT_RADIUS = 2;

/** Альфа заливки собственных сделок (абсолютное значение, как в canvas-версии). */
const OWN_TRADE_FILL_ALPHA = 0.65;

/** Геометрия и цвет связи уже размещенного элемента цепочки сделок. */
interface DrewItemMeta {
  xLeft: number;
  xRight: number;
  yTop: number;
  yBottom: number;
  connectionColor: FillSpec;
}

/** Сделка, спроецированная на видимые строки стакана. */
interface TradeDisplay {
  rowMinIndex: number;
  rowMaxIndex: number;
  volume: number;
  isBuy: boolean;
}

/** Текст, который нужно разместить поверх фигуры элемента. */
interface PendingText {
  text: string;
  x: number;
  y: number;
  tint: FillSpec;
}

/** Подготовленный элемент цепочки сделок: метаданные, отрисовка фигуры и текст. */
interface BuiltItem {
  meta: DrewItemMeta;
  drawShape: ((g: Graphics) => void) | null;
  text: PendingText | null;
}

/** Линия связи между соседними элементами цепочки сделок. */
interface ConnectorDraw {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: FillSpec;
}

/** Агрегированные по строке собственные сделки. */
interface OwnTradesRowAggregate {
  priceIndex: number;
  buyVolume: number;
  sellVolume: number;
}

/**
 * Панель ленты сделок: pixi-порт canvas-компонента trades-panel из scalper-order-book.
 *
 * Рисует (снизу вверх):
 * - линии сетки на ценах minor/major уровней;
 * - собственные сделки (прямоугольники buy/sell у правого края строки);
 * - линии связи между соседними сделками цепочки;
 * - цепочку обезличенных сделок от правого края влево (новые справа):
 *   эллипсы с объемом, "ghost" сделки вне baseRange строк, маркеры сделок
 *   за пределами видимого диапазона и маленькие прямоугольники отфильтрованных сделок.
 *
 * Координаты локальны секции: x в [0, ширина секции), y в координатах канвы.
 */
export class TradesPanelElement implements RenderElement {
  readonly container = new Container();

  readonly interestMask = DirtyFlags.Rows
    | DirtyFlags.Trades
    | DirtyFlags.OwnTrades
    | DirtyFlags.Theme
    | DirtyFlags.Settings
    | DirtyFlags.Layout
    | DirtyFlags.Viewport;

  private readonly gridGraphics = new Graphics();

  private readonly ownTradesGraphics = new Graphics();

  private readonly ownTradeTextsLayer = new Container();

  private readonly connectorsGraphics = new Graphics();

  private readonly itemsGraphics = new Graphics();

  private readonly itemTextsLayer = new Container();

  private readonly itemTexts: BitmapText[] = [];

  private readonly ownTradeTexts: BitmapText[] = [];

  constructor() {
    this.container.addChild(this.gridGraphics);
    this.container.addChild(this.ownTradesGraphics);
    this.container.addChild(this.ownTradeTextsLayer);
    this.container.addChild(this.connectorsGraphics);
    this.container.addChild(this.itemsGraphics);
    this.container.addChild(this.itemTextsLayer);
  }

  update(ctx: FrameContext): void {
    this.clearAll();

    const panel = ctx.layout.trades;
    const range = ctx.visibleRange;

    if (panel == null || range == null) {
      return;
    }

    const priceItems = ctx.model.rows.slice(range.start, range.end + 1);
    if (priceItems.length === 0) {
      return;
    }

    const width = panel.width;
    const yOrigin = (range.start * ctx.viewport.rowHeight) - ctx.viewport.scrollOffset;

    this.drawGridLines(ctx, priceItems, width, yOrigin);
    this.drawOwnTrades(ctx, priceItems, width, yOrigin);
    this.drawTradesChain(ctx, priceItems, width, yOrigin);
  }

  destroy(): void {
    this.itemTexts.forEach(t => t.destroy());
    this.itemTexts.length = 0;
    this.ownTradeTexts.forEach(t => t.destroy());
    this.ownTradeTexts.length = 0;

    this.gridGraphics.destroy();
    this.ownTradesGraphics.destroy();
    this.connectorsGraphics.destroy();
    this.itemsGraphics.destroy();
    this.ownTradeTextsLayer.destroy();
    this.itemTextsLayer.destroy();
    this.container.destroy();
  }

  private clearAll(): void {
    this.gridGraphics.clear();
    this.ownTradesGraphics.clear();
    this.connectorsGraphics.clear();
    this.itemsGraphics.clear();

    for (const text of this.itemTexts) {
      text.visible = false;
    }

    for (const text of this.ownTradeTexts) {
      text.visible = false;
    }
  }

  /** Горизонтальные линии сетки на строках с ценами minor/major уровней. */
  private drawGridLines(
    ctx: FrameContext,
    priceItems: BodyRow[],
    width: number,
    yOrigin: number
  ): void {
    const rowHeight = ctx.viewport.rowHeight;
    const yRowOffset = Math.ceil(rowHeight / 2);
    const g = this.gridGraphics;

    for (let i = 0; i < priceItems.length; i++) {
      const priceRow = priceItems[i];
      if (priceRow.isMinorLinePrice || priceRow.isMajorLinePrice) {
        const y = yOrigin + (i * rowHeight) + yRowOffset;
        g.moveTo(0, y);
        g.lineTo(width, y);
        g.stroke({
          width: priceRow.isMajorLinePrice ? 2 : 1,
          color: ctx.theme.tableGrid.color,
          alpha: ctx.theme.tableGrid.alpha
        });
      }
    }
  }

  /**
   * Цепочка обезличенных сделок: итерация от новых к старым, размещение справа налево.
   * Элементы рисуются от старых к новым, чтобы новые перекрывали старые;
   * линии связи рисуются отдельным слоем под элементами.
   */
  private drawTradesChain(
    ctx: FrameContext,
    priceItems: BodyRow[],
    width: number,
    yOrigin: number
  ): void {
    const items: BuiltItem[] = [];
    const connectors: ConnectorDraw[] = [];
    let prevItem: DrewItemMeta | null = null;

    const trades = new CustomIteratorWrapper<AggregatedTrade | null>(
      () => new AggregatedTradesIterator(ctx.model.trades, ctx.model.tradesPanelSettings.tradesAggregationPeriodMs)
    );

    for (const trade of trades) {
      if (trade == null) {
        continue;
      }

      const currentItem = this.buildTradeItem(trade, priceItems, prevItem, ctx, width, yOrigin);

      if (currentItem.meta.xRight < 0) {
        break;
      }

      items.push(currentItem);

      if (prevItem != null) {
        connectors.push({
          x1: this.getCenter(currentItem.meta.xLeft, currentItem.meta.xRight),
          y1: this.getCenter(currentItem.meta.yTop, currentItem.meta.yBottom),
          x2: this.getCenter(prevItem.xLeft, prevItem.xRight),
          y2: this.getCenter(prevItem.yTop, prevItem.yBottom),
          color: prevItem.connectionColor
        });
      }

      prevItem = currentItem.meta;
    }

    for (const connector of connectors) {
      this.connectorsGraphics.moveTo(connector.x1, connector.y1);
      this.connectorsGraphics.lineTo(connector.x2, connector.y2);
      this.connectorsGraphics.stroke({
        width: 1,
        color: connector.color.color,
        alpha: connector.color.alpha
      });
    }

    let textIndex = 0;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];

      if (item.drawShape != null) {
        item.drawShape(this.itemsGraphics);
      }

      if (item.text != null) {
        const text = this.getPooledText(this.itemTexts, this.itemTextsLayer, textIndex, ctx.fonts);
        this.applyText(text, item.text);
        textIndex++;
      }
    }
  }

  /** Подготавливает элемент для одной (возможно агрегированной) сделки. */
  private buildTradeItem(
    trade: AggregatedTrade,
    priceItems: BodyRow[],
    prevItem: DrewItemMeta | null,
    ctx: FrameContext,
    width: number,
    yOrigin: number
  ): BuiltItem {
    let mappedMinPriceIndex = -1;
    let mappedMaxPriceIndex = -1;

    const isFiltered = trade.volume < ctx.model.tradesPanelSettings.minTradeVolumeFilter;

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
      isBuy: trade.side === Side.Buy,
      volume: trade.volume
    };

    if (tradeDisplay.rowMaxIndex >= 0 || tradeDisplay.rowMinIndex >= 0) {
      return isFiltered
        ? this.buildFilteredItem(tradeDisplay, prevItem, ctx, width, yOrigin, ctx.model.tradesPanelSettings.hideFilteredTrades, false)
        : this.buildInnerItem(tradeDisplay, prevItem, ctx, width, yOrigin, false);
    }

    if (trade.minPrice < priceItems[0].baseRange.max && trade.maxPrice > priceItems[priceItems.length - 1].baseRange.min) {
      // "Ghost" сделка: цена внутри видимого диапазона, но не попала в baseRange ни одной строки.
      const correctedTrade: TradeDisplay = {
        ...tradeDisplay,
        rowMinIndex: this.getNearestPriceIndex(trade.minPrice, priceItems),
        rowMaxIndex: this.getNearestPriceIndex(trade.maxPrice, priceItems)
      };

      return isFiltered
        ? this.buildFilteredItem(correctedTrade, prevItem, ctx, width, yOrigin, ctx.model.tradesPanelSettings.hideFilteredTrades, true)
        : this.buildInnerItem(correctedTrade, prevItem, ctx, width, yOrigin, true);
    }

    const rowIndex = trade.minPrice > priceItems[0].baseRange.max
      ? 0
      : priceItems.length;

    return this.buildOuterItem(tradeDisplay, rowIndex, prevItem, ctx, width, yOrigin);
  }

  /** Эллипс с текстом объема для сделки внутри видимого диапазона. */
  private buildInnerItem(
    item: TradeDisplay,
    prevItemMeta: DrewItemMeta | null,
    ctx: FrameContext,
    width: number,
    yOrigin: number,
    isGhostTrade: boolean
  ): BuiltItem {
    const rowHeight = ctx.viewport.rowHeight;
    const rowMinIndex = item.rowMinIndex >= 0 ? item.rowMinIndex : item.rowMaxIndex;
    const rowMaxIndex = item.rowMaxIndex >= 0 ? item.rowMaxIndex : item.rowMinIndex;

    const prevLeftX = prevItemMeta?.xLeft ?? width;
    const yTop = yOrigin + (rowMaxIndex * rowHeight);
    const yBottom = yOrigin + (rowMinIndex * rowHeight) + rowHeight;

    const itemText = item.volume.toString();
    const textWidth = Math.ceil(ctx.fonts.measureTextWidth(itemText, TRADE_ITEM_FONT_SIZE));

    const itemWidth = Math.max(textWidth + TEXT_MARGINS, FONT_LINE_HEIGHT_APPROX, rowHeight);
    let xRight = prevItemMeta != null
      ? Math.floor(prevItemMeta.xLeft + ((prevItemMeta.xRight - prevItemMeta.xLeft) / 2))
      : width;

    if ((xRight - (itemWidth / 2)) > prevLeftX) {
      xRight = Math.floor(prevLeftX + (itemWidth / 2));
    }

    const xRadius = Math.ceil(itemWidth / 2);
    const xCenter = Math.floor(xRight - xRadius);
    const yCenter = Math.floor(yTop + ((yBottom - yTop) / 2));
    const yRadius = Math.max(xRadius, Math.ceil((yBottom - yTop) / 2));

    const sideFill = item.isBuy ? ctx.theme.buy : ctx.theme.sell;
    const fill = isGhostTrade ? ctx.theme.componentBackground : sideFill;
    const stroke = isGhostTrade ? sideFill : ctx.theme.textMaxContrast;
    const textTint = isGhostTrade ? ctx.theme.text : ctx.theme.buySellBtnText;

    return {
      meta: {
        xLeft: Math.floor(xCenter - xRadius),
        xRight: Math.ceil(xCenter + xRadius),
        yTop,
        yBottom,
        connectionColor: item.isBuy ? ctx.theme.buyBackground : ctx.theme.sellBackground
      },
      drawShape: (g: Graphics): void => {
        g.ellipse(xCenter, yCenter, xRadius, yRadius)
          .fill(fill)
          .stroke({width: 1, color: stroke.color, alpha: stroke.alpha});
      },
      text: {
        text: itemText,
        x: xCenter,
        y: yCenter,
        tint: textTint
      }
    };
  }

  /** Маленький прямоугольник для сделки с объемом меньше фильтра. */
  private buildFilteredItem(
    item: TradeDisplay,
    prevItemMeta: DrewItemMeta | null,
    ctx: FrameContext,
    width: number,
    yOrigin: number,
    isHidden: boolean,
    isGhostTrade: boolean
  ): BuiltItem {
    const rowHeight = ctx.viewport.rowHeight;
    const rowMinIndex = item.rowMinIndex >= 0 ? item.rowMinIndex : item.rowMaxIndex;
    const rowMaxIndex = item.rowMaxIndex >= 0 ? item.rowMaxIndex : item.rowMinIndex;

    const prevLeftX = prevItemMeta?.xLeft ?? (width - 1);
    const yTop = yOrigin + (rowMaxIndex * rowHeight);
    const yBottom = yOrigin + (rowMinIndex * rowHeight) + rowHeight;

    const itemWidth = Math.max(4, Math.round(rowHeight / 2));
    const xLeft = Math.floor(prevLeftX - itemWidth);
    const itemHeight = rowMinIndex === rowMaxIndex
      ? itemWidth
      : Math.floor(yBottom - yTop);

    const itemTopY = rowMinIndex === rowMaxIndex
      ? Math.ceil(yTop + (rowHeight / 2) - (itemHeight / 2))
      : yTop;

    const sideFill = item.isBuy ? ctx.theme.buy : ctx.theme.sell;
    const fill = isGhostTrade ? ctx.theme.componentBackground : sideFill;
    const stroke = isGhostTrade ? sideFill : ctx.theme.textMaxContrast;

    return {
      meta: {
        xLeft,
        xRight: Math.ceil(xLeft + itemWidth),
        yTop,
        yBottom,
        connectionColor: item.isBuy ? ctx.theme.buyBackground : ctx.theme.sellBackground
      },
      drawShape: isHidden
        ? null
        : (g: Graphics): void => {
          g.roundRect(Math.round(xLeft), Math.round(itemTopY), Math.floor(itemWidth), Math.floor(itemHeight), RECT_RADIUS)
            .fill(fill)
            .stroke({width: 1, color: stroke.color, alpha: stroke.alpha});
        },
      text: null
    };
  }

  /** Полый эллипс-маркер для сделки за пределами видимого диапазона цен. */
  private buildOuterItem(
    item: TradeDisplay,
    rowIndex: number,
    prevItemMeta: DrewItemMeta | null,
    ctx: FrameContext,
    width: number,
    yOrigin: number
  ): BuiltItem {
    const rowHeight = ctx.viewport.rowHeight;
    const prevLeftX = prevItemMeta?.xLeft ?? width;
    const xRight = Math.floor(prevLeftX - rowHeight);

    const yTop = yOrigin + (rowIndex * rowHeight);
    const yBottom = yTop + rowHeight;

    const xRadius = Math.ceil(rowHeight / 2);
    const xCenter = Math.floor(xRight - xRadius);
    const yCenter = Math.floor(yTop + ((yBottom - yTop) / 2));
    const yRadius = Math.max(xRadius, Math.ceil((yBottom - yTop) / 2));

    const stroke = item.isBuy ? ctx.theme.buyBackground : ctx.theme.sellBackground;

    return {
      meta: {
        xLeft: Math.floor(xRight - rowHeight),
        xRight,
        yTop,
        yBottom,
        connectionColor: stroke
      },
      drawShape: (g: Graphics): void => {
        g.ellipse(xCenter, yCenter, xRadius, yRadius)
          .stroke({width: 1, color: stroke.color, alpha: stroke.alpha});
      },
      text: null
    };
  }

  /** Индекс ближайшей строки для цены, не попавшей в baseRange ни одной строки. */
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

  /** Собственные сделки: прямоугольники buy/sell у правого края соответствующей строки. */
  private drawOwnTrades(
    ctx: FrameContext,
    priceItems: BodyRow[],
    width: number,
    yOrigin: number
  ): void {
    if (ctx.model.tradesPanelSettings.showOwnTrades !== true) {
      return;
    }

    let textIndex = 0;

    for (const aggregate of this.aggregateOwnTrades(ctx.model.ownTrades, priceItems)) {
      let prevLeft: number | null = null;

      if (aggregate.sellVolume !== 0) {
        prevLeft = this.drawOwnTradeItem(ctx, aggregate.priceIndex, aggregate.sellVolume, Side.Sell, null, width, yOrigin, textIndex) - 2;
        textIndex++;
      }

      if (aggregate.buyVolume !== 0) {
        this.drawOwnTradeItem(ctx, aggregate.priceIndex, aggregate.buyVolume, Side.Buy, prevLeft, width, yOrigin, textIndex);
        textIndex++;
      }
    }
  }

  /** Рисует один прямоугольник собственной сделки и возвращает его левую координату. */
  private drawOwnTradeItem(
    ctx: FrameContext,
    priceIndex: number,
    volume: number,
    side: Side,
    right: number | null,
    width: number,
    yOrigin: number,
    textIndex: number
  ): number {
    const rowHeight = ctx.viewport.rowHeight;
    const yTop = yOrigin + (priceIndex * rowHeight);

    const itemText = volume.toString();
    const textWidth = Math.ceil(ctx.fonts.measureTextWidth(itemText, TRADE_ITEM_FONT_SIZE));
    const itemWidth = Math.max(textWidth + TEXT_MARGINS, FONT_LINE_HEIGHT_APPROX, rowHeight);
    const xRight = right ?? (width - 1);
    const xLeft = Math.floor(xRight - itemWidth);
    const itemHeight = Math.floor(rowHeight);

    const accent = side === Side.Buy ? ctx.theme.buyAccent : ctx.theme.sellAccent;

    this.ownTradesGraphics
      .roundRect(Math.round(xLeft), Math.round(yTop), Math.round(itemWidth), Math.round(itemHeight), RECT_RADIUS)
      .fill({color: accent.color, alpha: OWN_TRADE_FILL_ALPHA})
      .stroke({width: 1, color: ctx.theme.text.color, alpha: ctx.theme.text.alpha});

    const text = this.getPooledText(this.ownTradeTexts, this.ownTradeTextsLayer, textIndex, ctx.fonts);
    this.applyText(text, {
      text: itemText,
      x: Math.round(this.getCenter(xLeft, xRight)),
      y: Math.round(this.getCenter(yTop, yTop + itemHeight)),
      tint: ctx.theme.textMaxContrast
    });

    return xLeft;
  }

  /** Агрегация собственных сделок по индексу видимой строки. */
  private aggregateOwnTrades(trades: OwnTradeDisplay[], priceItems: BodyRow[]): OwnTradesRowAggregate[] {
    const aggregated = new Map<number, { buyVolume: number, sellVolume: number }>();

    for (const trade of trades) {
      let priceIndex = priceItems.findIndex(
        (p: BodyRow): boolean => trade.price >= p.baseRange.min && trade.price <= p.baseRange.max
      );

      if (priceIndex === -1) {
        if (trade.price < priceItems[0].baseRange.max && trade.price > priceItems[priceItems.length - 1].baseRange.min) {
          priceIndex = this.getNearestPriceIndex(trade.price, priceItems);
        } else {
          continue;
        }
      }

      const existedItem = aggregated.get(priceIndex);

      aggregated.set(
        priceIndex,
        {
          buyVolume: (existedItem?.buyVolume ?? 0) + (trade.side === Side.Buy ? trade.qtyBatch : 0),
          sellVolume: (existedItem?.sellVolume ?? 0) + (trade.side === Side.Sell ? trade.qtyBatch : 0)
        }
      );
    }

    const result: OwnTradesRowAggregate[] = [];
    aggregated.forEach((volumes, priceIndex): void => {
      result.push({
        priceIndex,
        buyVolume: volumes.buyVolume,
        sellVolume: volumes.sellVolume
      });
    });

    return result;
  }

  private getCenter(start: number, end: number): number {
    return start + ((end - start) / 2);
  }

  /** Возвращает текст из пула по индексу, создавая новый при необходимости. */
  private getPooledText(
    pool: BitmapText[],
    parent: Container,
    index: number,
    fonts: FontProvider
  ): BitmapText {
    const fontFamily = fonts.getFontFamily(TRADE_ITEM_FONT_SIZE);

    if (index < pool.length) {
      const existing = pool[index];

      // Имя шрифта включает resolution и может смениться при смене devicePixelRatio.
      if (existing.style.fontFamily !== fontFamily) {
        existing.style.fontFamily = fontFamily;
      }

      existing.visible = true;
      return existing;
    }

    const created = new BitmapText({
      text: '',
      style: {
        fontFamily,
        fontSize: TRADE_ITEM_FONT_SIZE
      }
    });

    created.anchor.set(0.5, 0.5);
    pool.push(created);
    parent.addChild(created);

    return created;
  }

  private applyText(target: BitmapText, pending: PendingText): void {
    if (target.text !== pending.text) {
      target.text = pending.text;
    }

    target.tint = pending.tint.color;
    target.alpha = pending.tint.alpha;
    target.x = pending.x;
    target.y = pending.y;
  }
}
