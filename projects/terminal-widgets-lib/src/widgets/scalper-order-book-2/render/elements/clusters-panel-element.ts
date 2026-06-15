import {
  BitmapText,
  Container,
  Graphics
} from 'pixi.js';
import {TradesClusterHighlightMode} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {TradesCluster} from '@terminal-widgets-lib/widgets/scalper-order-book/types/trades-clusters.types';
import {BodyRow} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {
  ClustersDisplaySettings,
  DirtyFlags,
  FillSpec,
  FontProvider,
  FrameContext,
  ValueFormatters,
  VisibleRange
} from '../render-contracts';
import {ColorHelper} from '../color-helper';
import {RenderElement} from './render-element';

/** Правый отступ текста объема в px. */
const TEXT_RIGHT_PADDING_PX = 2;

/**
 * Зазор обрезки текста у левого края колонки: длинное число обрезается чуть раньше
 * разделителя и не упирается в него.
 */
const COLUMN_TEXT_GAP = 2;

/** Минимальное скрытое смещение в px, при котором показывается индикатор прокрутки. */
const SCROLL_INDICATOR_THRESHOLD = 3;

/** Ширина цветовой тени-индикатора прокрутки у края панели в px. */
const SCROLL_INDICATOR_WIDTH = 6;

/** Пиковая прозрачность тени-индикатора прокрутки у самого края. */
const SCROLL_INDICATOR_PEAK_ALPHA = 0.25;

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
 * Слот одной колонки: собственный контейнер с маской и пул текстов.
 * Маска ограничена прямоугольником колонки, поэтому текст не может попасть
 * в соседнюю колонку даже при сильном переполнении.
 */
interface ColumnSlot {
  container: Container;
  mask: Graphics;
  texts: BitmapText[];
  usedTexts: number;
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

  // Слой колонок: содержит слоты, лежит под индикатором прокрутки.
  private readonly slotsLayer = new Container();

  // Цветовая тень-индикатор горизонтальной прокрутки у краев панели (поверх контента).
  private readonly scrollIndicatorGraphics = new Graphics();

  // Слоты колонок: каждый со своей маской, чтобы текст одной колонки
  // не мог быть виден в соседней.
  private readonly columnSlots: ColumnSlot[] = [];

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
    this.container.addChild(this.slotsLayer);
    this.container.addChild(this.scrollIndicatorGraphics);
  }

  update(ctx: FrameContext): void {
    this.backgroundGraphics.clear();
    this.gridGraphics.clear();
    this.borderGraphics.clear();
    this.scrollIndicatorGraphics.clear();

    const panel = ctx.layout.clusters;
    const range = ctx.visibleRange;
    if (panel == null || range == null) {
      this.hideSlotsFrom(0);
      return;
    }

    const columnWidth = ctx.clustersScroll.columnWidth;
    const clusters = ctx.model.clusters;
    let visibleColumnIndex = 0;

    for (let col = 0; col < clusters.length; col++) {
      const left = (col * columnWidth) - ctx.clustersScroll.offset;
      if (left + columnWidth <= 0 || left >= panel.width) {
        continue;
      }

      const slot = this.acquireColumnSlot(visibleColumnIndex);

      // Маска слота ограничена прямоугольником колонки (с зазором слева у разделителя).
      const maskLeft = left + COLUMN_TEXT_GAP;
      const maskWidth = columnWidth - COLUMN_TEXT_GAP;
      if (maskWidth > 0) {
        slot.mask.rect(maskLeft, 0, maskWidth, ctx.viewport.height).fill(0xffffff);
      }

      this.drawColumn(ctx, range, clusters[col], col, left, slot);
      visibleColumnIndex++;
    }

    this.hideSlotsFrom(visibleColumnIndex);
    this.drawScrollIndicators(ctx, panel.width);
  }

  destroy(): void {
    for (const slot of this.columnSlots) {
      slot.container.destroy({children: true});
    }

    this.columnSlots.length = 0;

    this.backgroundGraphics.destroy();
    this.gridGraphics.destroy();
    this.borderGraphics.destroy();
    this.slotsLayer.destroy();
    this.scrollIndicatorGraphics.destroy();
    this.container.destroy();
  }

  /**
   * Цветовая тень-индикатор у краев панели, когда есть прокрученный контент:
   * слева - если часть колонок скрыта слева, справа - если скрыта справа.
   * Повторяет inset box-shadow исходной DOM-версии.
   */
  private drawScrollIndicators(ctx: FrameContext, panelWidth: number): void {
    const scroll = ctx.clustersScroll;
    const leftHidden = scroll.offset;
    const rightHidden = scroll.totalWidth - panelWidth - scroll.offset;
    const height = ctx.viewport.height;
    const primary = ctx.theme.primary;

    if (leftHidden > SCROLL_INDICATOR_THRESHOLD) {
      this.drawEdgeShadow(0, height, primary, false);
    }

    if (rightHidden > SCROLL_INDICATOR_THRESHOLD) {
      this.drawEdgeShadow(panelWidth, height, primary, true);
    }
  }

  /** Рисует затухающую от края внутрь полосу-тень (ступенчатая прозрачность). */
  private drawEdgeShadow(edgeX: number, height: number, color: FillSpec, fromRight: boolean): void {
    for (let i = 0; i < SCROLL_INDICATOR_WIDTH; i++) {
      const fade = (SCROLL_INDICATOR_WIDTH - i) / SCROLL_INDICATOR_WIDTH;
      // Мягкая тень: невысокая пиковая прозрачность и квадратичное затухание,
      // чтобы индикатор не отвлекал внимание.
      const alpha = color.alpha * SCROLL_INDICATOR_PEAK_ALPHA * fade * fade;
      const x = fromRight ? edgeX - (i + 1) : edgeX + i;
      this.scrollIndicatorGraphics.rect(x, 0, 1, height).fill({color: color.color, alpha});
    }
  }

  /** Рисует одну колонку кластера в её изолированный слот. */
  private drawColumn(
    ctx: FrameContext,
    range: VisibleRange,
    cluster: TradesCluster,
    columnIndex: number,
    left: number,
    slot: ColumnSlot
  ): void {
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

    const {cells, maxVolume} = this.getColumnCells(ctx.model.rows, ctx.model.clusters, cluster, range, columnIndex);

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
        this.drawVolumeText(ctx, cell.volume, right, y, slot);
      }
    }

    this.hideSlotTextsFrom(slot, slot.usedTexts);
  }

  /**
   * Ширина колонки кластера по содержимому: самый широкий видимый объем плюс отступы.
   * Колонка не уже содержимого, поэтому числа не обрезаются; лишняя ширина
   * обрабатывается горизонтальной прокруткой панели.
   */
  measureColumnContentWidth(
    rows: BodyRow[],
    range: VisibleRange,
    clusters: TradesCluster[],
    settings: ClustersDisplaySettings,
    fonts: FontProvider,
    formatters: ValueFormatters,
    fontSize: number
  ): number {
    let maxText = 0;

    for (let col = 0; col < clusters.length; col++) {
      const {cells} = this.getColumnCells(rows, clusters, clusters[col], range, col);
      for (const cell of cells) {
        if (cell.volume != null) {
          const text = formatters.formatVolume(cell.volume, settings.volumeDisplayFormat);
          maxText = Math.max(maxText, fonts.measureTextWidth(text, fontSize));
        }
      }
    }

    if (maxText <= 0) {
      return 0;
    }

    // Текст выровнен по правому краю с отступом TEXT_RIGHT_PADDING_PX,
    // слева маска оставляет COLUMN_TEXT_GAP - учитываем оба отступа.
    return Math.ceil(maxText) + TEXT_RIGHT_PADDING_PX + COLUMN_TEXT_GAP;
  }

  /** Возвращает агрегацию колонки из кэша, пересчитывая при изменении исходных данных. */
  private getColumnCells(
    rows: BodyRow[],
    clusters: TradesCluster[],
    cluster: TradesCluster,
    range: VisibleRange,
    columnIndex: number
  ): { cells: CellAggregate[], maxVolume: number } {
    if (this.cacheRowsRef !== rows
      || this.cacheClustersRef !== clusters
      || this.cacheRangeStart !== range.start
      || this.cacheRangeEnd !== range.end) {
      this.cachedColumns.length = 0;
      this.cacheRowsRef = rows;
      this.cacheClustersRef = clusters;
      this.cacheRangeStart = range.start;
      this.cacheRangeEnd = range.end;
    }

    let cached = this.cachedColumns[columnIndex];
    if (cached == null) {
      cached = this.computeColumnCells(rows, cluster, range);
      this.cachedColumns[columnIndex] = cached;
    }

    return cached;
  }

  /** Агрегирует элементы кластера по видимым строкам стакана и находит максимальный объем. */
  private computeColumnCells(
    rows: BodyRow[],
    cluster: TradesCluster,
    range: VisibleRange
  ): { cells: CellAggregate[], maxVolume: number } {
    const cells: CellAggregate[] = [];
    let maxVolume = 0;

    for (let i = range.start; i <= range.end && i < rows.length; i++) {
      const baseRange = rows[i].baseRange;

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

  /** Рисует текст объема, выровненный по правому краю ячейки, в слот колонки. */
  private drawVolumeText(
    ctx: FrameContext,
    volume: number,
    cellRight: number,
    rowTop: number,
    slot: ColumnSlot
  ): void {
    const text = this.acquireSlotText(slot, ctx);
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

  /** Возвращает слот колонки по индексу видимой колонки, создавая при необходимости. */
  private acquireColumnSlot(index: number): ColumnSlot {
    let slot = this.columnSlots[index];
    if (slot == null) {
      const container = new Container();
      const mask = new Graphics();
      container.addChild(mask);
      container.mask = mask;
      this.slotsLayer.addChild(container);

      slot = {container, mask, texts: [], usedTexts: 0};
      this.columnSlots[index] = slot;
    }

    slot.container.visible = true;
    slot.mask.clear();
    slot.usedTexts = 0;

    return slot;
  }

  /** Возвращает текст из пула слота, создавая новый при необходимости. */
  private acquireSlotText(slot: ColumnSlot, ctx: FrameContext): BitmapText {
    const fontSize = ctx.viewport.fontSize;
    const fontFamily = ctx.fonts.getFontFamily(fontSize);

    let text = slot.texts[slot.usedTexts];
    if (text == null) {
      text = new BitmapText({
        text: '',
        style: {
          fontFamily,
          fontSize
        }
      });

      text.roundPixels = true;

      slot.texts.push(text);
      slot.container.addChild(text);
    } else {
      if (text.style.fontFamily !== fontFamily) {
        text.style.fontFamily = fontFamily;
      }

      if (text.style.fontSize !== fontSize) {
        text.style.fontSize = fontSize;
      }
    }

    slot.usedTexts++;

    return text;
  }

  /** Скрывает неиспользованные тексты слота. */
  private hideSlotTextsFrom(slot: ColumnSlot, startIndex: number): void {
    for (let i = startIndex; i < slot.texts.length; i++) {
      slot.texts[i].visible = false;
    }
  }

  /** Скрывает слоты колонок, не использованные в текущем кадре. */
  private hideSlotsFrom(startIndex: number): void {
    for (let i = startIndex; i < this.columnSlots.length; i++) {
      this.columnSlots[i].container.visible = false;
    }
  }
}
