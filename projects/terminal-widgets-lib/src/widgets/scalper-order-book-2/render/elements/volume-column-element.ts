import {
  Container,
  Graphics
} from 'pixi.js';
import {
  BodyRow,
  ScalperOrderBookRowType
} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {
  VolumeHighlightMode,
  VolumeHighlightOption
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {
  DirtyFlags,
  FillSpec,
  FrameContext
} from '../render-contracts';
import {ColorHelper} from '../color-helper';
import {RenderElement} from './render-element';
import {BitmapTextPool} from './bitmap-text-pool';

interface VolumeHighlight {
  fill: FillSpec;
  widthPercent: number;
}

const TEXT_PADDING = 8;

/**
 * Колонка объемов таблицы стакана: полосы подсветки объема
 * (режимы BiggestVolume и VolumeBoundsWithFixedValue), значения объема,
 * накопленный объем и раздельные объемы "ask | bid" для mixed строк.
 */
export class VolumeColumnElement implements RenderElement {
  readonly container = new Container();

  readonly interestMask = DirtyFlags.Rows
    | DirtyFlags.Theme
    | DirtyFlags.Settings
    | DirtyFlags.Layout
    | DirtyFlags.Viewport;

  private readonly highlightGraphics = new Graphics();

  private readonly textPool: BitmapTextPool;

  // Кэш максимального объема: пересчитывается только при новой ссылке на строки.
  private maxVolumeRowsRef: BodyRow[] | null = null;

  private cachedMaxVolume = 0;

  // Кэш отсортированных опций подсветки с разобранными цветами.
  private highlightOptionsRef: VolumeHighlightOption[] | null = null;

  private cachedSortedOptions: { boundary: number, fill: FillSpec }[] = [];

  constructor() {
    this.container.addChild(this.highlightGraphics);
    this.textPool = new BitmapTextPool(this.container);
  }

  update(ctx: FrameContext): void {
    const g = this.highlightGraphics;
    g.clear();
    this.textPool.beginFrame();

    const range = ctx.visibleRange;
    if (range == null) {
      this.textPool.endFrame();
      return;
    }

    const column = ctx.layout.tableColumns.volume;
    const rowHeight = ctx.viewport.rowHeight;
    const fontSize = ctx.viewport.fontSize;
    const settings = ctx.model.displaySettings;

    const maxOrderBookVolume = settings.volumeHighlightMode === VolumeHighlightMode.BiggestVolume
      ? this.getMaxOrderBookVolume(ctx.model.rows)
      : 0;

    for (let i = range.start; i <= range.end && i < ctx.model.rows.length; i++) {
      const row = ctx.model.rows[i];
      const volume = row.volume ?? 0;
      if (volume <= 0) {
        continue;
      }

      const y = (i * rowHeight) - ctx.viewport.scrollOffset;
      const textY = y + (rowHeight / 2);

      const highlight = this.getVolumeHighlight(ctx, row, maxOrderBookVolume);
      if (highlight != null && highlight.widthPercent > 0) {
        const barWidth = Math.min(100, highlight.widthPercent) / 100 * column.width;
        g.rect(column.x, y, barWidth, rowHeight).fill(highlight.fill);
      }

      const textFill = ctx.theme.textMaxContrast;

      if (row.rowType === ScalperOrderBookRowType.Mixed) {
        const askText = ctx.formatters.formatVolume(row.askVolume ?? 0, settings.volumeDisplayFormat);
        const bidText = ctx.formatters.formatVolume(row.bidVolume ?? 0, settings.volumeDisplayFormat);
        this.textPool.place(
          ctx.fonts,
          `${askText} | ${bidText}`,
          fontSize,
          textFill,
          column.x + TEXT_PADDING,
          textY,
          0,
          0.5
        );

        continue;
      }

      const volumeText = ctx.formatters.formatVolume(volume, settings.volumeDisplayFormat);
      const volumeTextItem = this.textPool.place(
        ctx.fonts,
        volumeText,
        fontSize,
        textFill,
        column.x + TEXT_PADDING,
        textY,
        0,
        0.5
      );

      if (ctx.model.showGrowingVolume && (row.growingVolume ?? 0) > 0) {
        const growingFontSize = Math.max(8, fontSize - 2);
        this.textPool.place(
          ctx.fonts,
          ctx.formatters.formatVolume(row.growingVolume!, settings.volumeDisplayFormat),
          growingFontSize,
          ColorHelper.withAlpha(textFill, 0.8),
          volumeTextItem.x + Math.ceil(ctx.fonts.measureTextWidth(volumeText, fontSize)) + 5,
          textY,
          0,
          0.5
        );
      }
    }

    this.textPool.endFrame();
  }

  destroy(): void {
    this.textPool.destroy();
    this.highlightGraphics.destroy();
    this.container.destroy();
  }

  private getVolumeHighlight(ctx: FrameContext, row: BodyRow, maxVolume: number): VolumeHighlight | null {
    const rowType = row.rowType ?? null;
    if (rowType !== ScalperOrderBookRowType.Ask
      && rowType !== ScalperOrderBookRowType.Bid
      && rowType !== ScalperOrderBookRowType.Mixed) {
      return null;
    }

    const settings = ctx.model.displaySettings;
    const volume = Math.max(row.askVolume ?? 0, row.bidVolume ?? 0);

    if (settings.volumeHighlightMode === VolumeHighlightMode.BiggestVolume) {
      if (maxVolume <= 0) {
        return null;
      }

      let fill = ctx.theme.mix;
      if (rowType === ScalperOrderBookRowType.Bid) {
        fill = ctx.theme.buy;
      } else if (rowType === ScalperOrderBookRowType.Ask) {
        fill = ctx.theme.sell;
      }

      return {
        fill: {color: fill.color, alpha: 0.6},
        widthPercent: Math.ceil(100 * (volume / maxVolume))
      };
    }

    if (settings.volumeHighlightMode === VolumeHighlightMode.VolumeBoundsWithFixedValue) {
      const option = this.getSortedHighlightOptions(settings.volumeHighlightOptions)
        .find(x => volume >= x.boundary);

      if (option == null) {
        return null;
      }

      let widthPercent = 0;
      if (settings.volumeHighlightFullness > 0) {
        widthPercent = Math.min(100, Math.ceil(100 * (volume / settings.volumeHighlightFullness)));
      }

      return {
        fill: option.fill,
        widthPercent
      };
    }

    return null;
  }

  private getMaxOrderBookVolume(rows: BodyRow[]): number {
    if (this.maxVolumeRowsRef !== rows) {
      this.maxVolumeRowsRef = rows;
      this.cachedMaxVolume = rows.reduce((max, curr) => Math.max(max, curr.askVolume ?? 0, curr.bidVolume ?? 0), 0);
    }

    return this.cachedMaxVolume;
  }

  private getSortedHighlightOptions(options: VolumeHighlightOption[]): { boundary: number, fill: FillSpec }[] {
    if (this.highlightOptionsRef !== options) {
      this.highlightOptionsRef = options;
      this.cachedSortedOptions = [...options]
        .sort((a, b) => b.boundary - a.boundary)
        .map(x => ({
          boundary: x.boundary,
          fill: ColorHelper.resolveFill(x.color)
        }));
    }

    return this.cachedSortedOptions;
  }
}
