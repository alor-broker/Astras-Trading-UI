import {
  BitmapText,
  Container,
  Graphics
} from 'pixi.js';
import {TradesClusterHighlightMode} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {TradesCluster} from '@terminal-widgets-lib/widgets/scalper-order-book/types/trades-clusters.types';
import {
  DirtyFlags,
  FillSpec,
  FrameContext,
  VisibleRange
} from '../render-contracts';
import {ColorHelper} from '../color-helper';
import {RenderElement} from './render-element';

/** Правый отступ текста объема в px. */
const TEXT_RIGHT_PADDING_PX = 8;

/** Целевой объем по умолчанию для режима подсветки TargetVolume. */
const DEFAULT_TARGET_VOLUME = 10000;

/** Прозрачность подсветки строки под курсором и фона строки максимального объема. */
const OVERLAY_ALPHA = 0.15;

/** Прозрачность заливки подсветки в режимах TargetVolume и BuyVsSell. */
const HIGHLIGHT_ALPHA = 0.5;

/** Агрегированные значения кластера по одной строке стакана. */
interface CellAggregate {
  /** Суммарный объем строки или null, если в строку не попал ни один элемент кластера. */
  volume: number | null;
  buyQty: number;
  sellQty: number;
}

/**
 * Панель кластеров сделок: колонки временных интервалов (от старых слева к новым справа).
 * Для каждой видимой строки стакана агрегирует объемы покупок/продаж кластера,
 * рисует линии сетки ценовых уровней, подсветку по выбранному режиму
 * (BuySellDominance/TargetVolume/BuyVsSell), выделение строки максимального объема,
 * подсветку строки под курсором и текст объема. Учитывает горизонтальную прокрутку панели.
 */
export class ClustersPanelElement implements RenderElement {
  readonly container = new Container();

  readonly interestMask = DirtyFlags.Rows
    | DirtyFlags.Clusters
    | DirtyFlags.Theme
    | DirtyFlags.Settings
    | DirtyFlags.Layout
    | DirtyFlags.Viewport
    | DirtyFlags.Hover
    | DirtyFlags.ClustersScroll;

  // Подсветки, фон строки максимального объема и подсветка hover.
  private readonly backgroundGraphics = new Graphics();

  // Горизонтальные линии ценовых уровней.
  private readonly gridGraphics = new Graphics();

  // Вертикальные разделители колонок и рамки строк максимального объема.
  private readonly borderGraphics = new Graphics();

  private readonly textContainer = new Container();

  private readonly textPool: BitmapText[] = [];

  // Кэш агрегации по колонкам: пересчитывается только при изменении строк,
  // данных кластеров или видимого диапазона. Кадры hover/прокрутки используют кэш.
  private cacheRowsRef: unknown = null;

  private cacheClustersRef: unknown = null;

  private cacheRangeStart = -1;

  private cacheRangeEnd = -1;

  private readonly cachedColumns: ({ cells: CellAggregate[], maxVolume: number } | undefined)[] = [];

  constructor() {
    this.container.addChild(this.backgroundGraphics);
    this.container.addChild(this.gridGraphics);
    this.container.addChild(this.borderGraphics);
    this.container.addChild(this.textContainer);
  }

  update(ctx: FrameContext): void {
    this.backgroundGraphics.clear();
    this.gridGraphics.clear();
    this.borderGraphics.clear();

    const panel = ctx.layout.clusters;
    const range = ctx.visibleRange;
    if (panel == null || range == null) {
      this.hideTextsFrom(0);
      return;
    }

    const columnWidth = ctx.clustersScroll.columnWidth;
    const clusters = ctx.model.clusters;
    let usedTexts = 0;

    for (let col = 0; col < clusters.length; col++) {
      const left = (col * columnWidth) - ctx.clustersScroll.offset;
      if (left + columnWidth <= 0 || left >= panel.width) {
        continue;
      }

      usedTexts = this.drawColumn(ctx, range, clusters[col], col, left, usedTexts);
    }

    this.hideTextsFrom(usedTexts);
  }

  destroy(): void {
    for (const text of this.textPool) {
      text.destroy();
    }

    this.textPool.length = 0;

    this.backgroundGraphics.destroy();
    this.gridGraphics.destroy();
    this.borderGraphics.destroy();
    this.textContainer.destroy();
    this.container.destroy();
  }

  /** Рисует одну колонку кластера. Возвращает количество занятых текстов пула. */
  private drawColumn(
    ctx: FrameContext,
    range: VisibleRange,
    cluster: TradesCluster,
    columnIndex: number,
    left: number,
    textStartIndex: number
  ): number {
    const rowHeight = ctx.viewport.rowHeight;
    const columnWidth = ctx.clustersScroll.columnWidth;
    const right = left + columnWidth;
    const borderColor = ctx.theme.tableBorder;

    // Вертикальный разделитель по правому краю колонки.
    this.borderGraphics.moveTo(right, 0);
    this.borderGraphics.lineTo(right, ctx.viewport.height);
    this.borderGraphics.stroke({
      width: 1,
      color: borderColor.color,
      alpha: borderColor.alpha
    });

    const {cells, maxVolume} = this.getColumnCells(ctx, cluster, range, columnIndex);

    let textIndex = textStartIndex;
    for (let i = range.start; i <= range.end && i < ctx.model.rows.length; i++) {
      const row = ctx.model.rows[i];
      const cell = cells[i - range.start];
      const y = (i * rowHeight) - ctx.viewport.scrollOffset;

      const isMaxVolume = cell.volume != null && cell.volume > 0 && cell.volume === maxVolume;

      if (isMaxVolume) {
        this.backgroundGraphics.rect(left, y, columnWidth, rowHeight)
          .fill(ColorHelper.withAlpha(ctx.theme.warning, OVERLAY_ALPHA));
      }

      this.drawHighlight(ctx, cell, left, y);

      if (ctx.hoveredRowIndex === i) {
        this.backgroundGraphics.rect(left, y, columnWidth, rowHeight)
          .fill(ColorHelper.withAlpha(ctx.theme.primary, OVERLAY_ALPHA));
      }

      // Линии сетки ценовых уровней.
      if (row.isMinorLinePrice || row.isMajorLinePrice) {
        const lineY = y + Math.ceil(rowHeight / 2);
        this.gridGraphics.moveTo(left, lineY);
        this.gridGraphics.lineTo(right, lineY);
        this.gridGraphics.stroke({
          width: row.isMajorLinePrice ? 2 : 1,
          color: borderColor.color,
          alpha: borderColor.alpha
        });
      }

      // Рамка строки максимального объема колонки.
      if (isMaxVolume) {
        const maxContrast = ctx.theme.textMaxContrast;
        this.borderGraphics.rect(left, y, columnWidth, rowHeight)
          .stroke({
            width: 1,
            color: maxContrast.color,
            alpha: maxContrast.alpha
          });
      }

      if (cell.volume != null) {
        this.drawVolumeText(ctx, cell.volume, right, y, textIndex);
        textIndex++;
      }
    }

    return textIndex;
  }

  /** Возвращает агрегацию колонки из кэша, пересчитывая при изменении исходных данных. */
  private getColumnCells(
    ctx: FrameContext,
    cluster: TradesCluster,
    range: VisibleRange,
    columnIndex: number
  ): { cells: CellAggregate[], maxVolume: number } {
    if (this.cacheRowsRef !== ctx.model.rows
      || this.cacheClustersRef !== ctx.model.clusters
      || this.cacheRangeStart !== range.start
      || this.cacheRangeEnd !== range.end) {
      this.cachedColumns.length = 0;
      this.cacheRowsRef = ctx.model.rows;
      this.cacheClustersRef = ctx.model.clusters;
      this.cacheRangeStart = range.start;
      this.cacheRangeEnd = range.end;
    }

    let cached = this.cachedColumns[columnIndex];
    if (cached == null) {
      cached = this.computeColumnCells(ctx, cluster, range);
      this.cachedColumns[columnIndex] = cached;
    }

    return cached;
  }

  /** Агрегирует элементы кластера по видимым строкам стакана и находит максимальный объем. */
  private computeColumnCells(
    ctx: FrameContext,
    cluster: TradesCluster,
    range: VisibleRange
  ): { cells: CellAggregate[], maxVolume: number } {
    const cells: CellAggregate[] = [];
    let maxVolume = 0;

    for (let i = range.start; i <= range.end && i < ctx.model.rows.length; i++) {
      const baseRange = ctx.model.rows[i].baseRange;

      let buySum = 0;
      let sellSum = 0;
      let hasItems = false;

      for (const item of cluster.tradeClusters) {
        if (item.price >= baseRange.min && item.price <= baseRange.max) {
          buySum += item.buyQty;
          sellSum += item.sellQty;
          hasItems = true;
        }
      }

      if (!hasItems) {
        cells.push({volume: null, buyQty: 0, sellQty: 0});
        continue;
      }

      const volume = Math.round(buySum + sellSum);
      maxVolume = Math.max(maxVolume, volume);

      cells.push({
        volume,
        buyQty: Math.round(buySum),
        sellQty: Math.round(sellSum)
      });
    }

    return {cells, maxVolume};
  }

  /** Рисует подсветку ячейки по выбранному режиму. */
  private drawHighlight(ctx: FrameContext, cell: CellAggregate, left: number, y: number): void {
    if (cell.volume == null || cell.volume === 0) {
      return;
    }

    const volume = cell.volume;
    const columnWidth = ctx.clustersScroll.columnWidth;
    const rowHeight = ctx.viewport.rowHeight;

    switch (ctx.model.clustersSettings.highlightMode) {
      case TradesClusterHighlightMode.BuySellDominance:
        this.drawBuySellDominance(ctx, cell, volume, left, y, columnWidth, rowHeight);
        break;
      case TradesClusterHighlightMode.TargetVolume:
        this.drawTargetVolume(ctx, cell, volume, left, y, columnWidth, rowHeight);
        break;
      case TradesClusterHighlightMode.BuyVsSell:
        this.drawBuyVsSell(ctx, cell, volume, left, y, columnWidth, rowHeight);
        break;
      case TradesClusterHighlightMode.Off:
        break;
    }
  }

  /** Подсветка преобладающей стороны: цвет стороны, прозрачность по доле объема. */
  private drawBuySellDominance(
    ctx: FrameContext,
    cell: CellAggregate,
    volume: number,
    left: number,
    y: number,
    columnWidth: number,
    rowHeight: number
  ): void {
    let base: FillSpec | null = null;
    let percent = 0;

    if (cell.buyQty > cell.sellQty) {
      base = ctx.theme.buy;
      percent = cell.buyQty / volume;
    } else if (cell.sellQty > cell.buyQty) {
      base = ctx.theme.sell;
      percent = cell.sellQty / volume;
    }

    if (base == null) {
      return;
    }

    percent = Math.min(1, Math.round(percent * 100) / 100);

    const opacity = percent > 0.75
      ? 0.8
      : Math.max(0, percent - 0.25);

    if (opacity <= 0) {
      return;
    }

    this.backgroundGraphics.rect(left, y, columnWidth, rowHeight)
      .fill({color: base.color, alpha: opacity});
  }

  /** Подсветка относительно целевого объема: полоса слева шириной по доле от цели. */
  private drawTargetVolume(
    ctx: FrameContext,
    cell: CellAggregate,
    volume: number,
    left: number,
    y: number,
    columnWidth: number,
    rowHeight: number
  ): void {
    const targetVolume = ctx.model.clustersSettings.targetVolume ?? DEFAULT_TARGET_VOLUME;

    let base = ctx.theme.mix;
    if (cell.buyQty > cell.sellQty) {
      base = ctx.theme.buy;
    }

    if (cell.buyQty < cell.sellQty) {
      base = ctx.theme.sell;
    }

    const percent = Math.min(100, Math.round((volume / targetVolume) * 100));
    const barWidth = (columnWidth * percent) / 100;
    if (barWidth <= 0) {
      return;
    }

    this.backgroundGraphics.rect(left, y, barWidth, rowHeight)
      .fill({color: base.color, alpha: HIGHLIGHT_ALPHA});
  }

  /** Подсветка покупок против продаж: два смежных прямоугольника по доле покупок. */
  private drawBuyVsSell(
    ctx: FrameContext,
    cell: CellAggregate,
    volume: number,
    left: number,
    y: number,
    columnWidth: number,
    rowHeight: number
  ): void {
    const buyPercent = Math.round((cell.buyQty / volume) * 100);
    const buyWidth = (columnWidth * buyPercent) / 100;

    if (buyWidth > 0) {
      this.backgroundGraphics.rect(left, y, buyWidth, rowHeight)
        .fill({color: ctx.theme.buy.color, alpha: HIGHLIGHT_ALPHA});
    }

    const sellWidth = columnWidth - buyWidth;
    if (sellWidth > 0) {
      this.backgroundGraphics.rect(left + buyWidth, y, sellWidth, rowHeight)
        .fill({color: ctx.theme.sell.color, alpha: HIGHLIGHT_ALPHA});
    }
  }

  /** Рисует текст объема, выровненный по правому краю ячейки. */
  private drawVolumeText(
    ctx: FrameContext,
    volume: number,
    cellRight: number,
    rowTop: number,
    textIndex: number
  ): void {
    const text = this.acquireText(textIndex, ctx);
    const formatted = ctx.formatters.formatVolume(volume, ctx.model.clustersSettings.volumeDisplayFormat);

    if (text.text !== formatted) {
      text.text = formatted;
    }

    const fill = ctx.theme.textMaxContrast;
    text.tint = fill.color;
    text.alpha = fill.alpha;
    text.anchor.set(1, 0.5);
    text.x = cellRight - TEXT_RIGHT_PADDING_PX;
    text.y = rowTop + (ctx.viewport.rowHeight / 2);
    text.visible = true;
  }

  /** Возвращает текст из пула, создавая новый при необходимости. */
  private acquireText(index: number, ctx: FrameContext): BitmapText {
    const fontSize = ctx.viewport.fontSize;
    const fontFamily = ctx.fonts.getFontFamily(fontSize);

    if (index < this.textPool.length) {
      const existing = this.textPool[index];

      if (existing.style.fontFamily !== fontFamily) {
        existing.style.fontFamily = fontFamily;
      }

      if (existing.style.fontSize !== fontSize) {
        existing.style.fontSize = fontSize;
      }

      return existing;
    }

    const created = new BitmapText({
      text: '',
      style: {
        fontFamily,
        fontSize
      }
    });

    this.textPool.push(created);
    this.textContainer.addChild(created);

    return created;
  }

  /** Скрывает неиспользованные в текущем кадре тексты пула. */
  private hideTextsFrom(startIndex: number): void {
    for (let i = startIndex; i < this.textPool.length; i++) {
      this.textPool[i].visible = false;
    }
  }
}
