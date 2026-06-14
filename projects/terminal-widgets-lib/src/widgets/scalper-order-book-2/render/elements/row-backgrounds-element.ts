import {
  Container,
  Graphics
} from 'pixi.js';
import {ScalperOrderBookRowType} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {
  DirtyFlags,
  FillSpec,
  FrameContext
} from '../render-contracts';
import {ColorHelper} from '../color-helper';
import {RenderElement} from './render-element';

/**
 * Фоны строк таблицы стакана: подсветка стороны (ask/bid/mixed/spread),
 * усиленная подсветка лучших цен и подсветка строки под курсором.
 */
export class RowBackgroundsElement implements RenderElement {
  readonly container = new Container();

  readonly interestMask = DirtyFlags.Rows
    | DirtyFlags.Theme
    | DirtyFlags.Settings
    | DirtyFlags.Layout
    | DirtyFlags.Viewport
    | DirtyFlags.Hover;

  private readonly graphics = new Graphics();

  constructor() {
    this.container.addChild(this.graphics);
  }

  update(ctx: FrameContext): void {
    const g = this.graphics;
    g.clear();

    const range = ctx.visibleRange;
    if (range == null) {
      return;
    }

    const width = ctx.layout.table.width;
    const rowHeight = ctx.viewport.rowHeight;

    // В колонке заявок фон рисуется только для строк лучших цен (как в DOM версии).
    const mainColumnsWidth = ctx.layout.tableColumns.orders.x;

    for (let i = range.start; i <= range.end && i < ctx.model.rows.length; i++) {
      const row = ctx.model.rows[i];
      const y = (i * rowHeight) - ctx.viewport.scrollOffset;

      const fill = this.getRowFill(ctx, row.rowType ?? null, (row.volume ?? 0) > 0, row.isBest === true);
      if (fill != null && fill.alpha > 0) {
        const fillWidth = row.isBest === true ? width : mainColumnsWidth;
        g.rect(0, y, fillWidth, rowHeight).fill(fill);
      }

      if (ctx.hoveredRowIndex === i) {
        g.rect(0, y, width, rowHeight).fill(ColorHelper.withAlpha(ctx.theme.primary, 0.15));
      }
    }
  }

  destroy(): void {
    this.graphics.destroy();
    this.container.destroy();
  }

  private getRowFill(
    ctx: FrameContext,
    rowType: ScalperOrderBookRowType | null,
    hasVolume: boolean,
    isBest: boolean
  ): FillSpec | null {
    switch (rowType) {
      case ScalperOrderBookRowType.Ask:
        return hasVolume
          ? ColorHelper.withAlpha(ctx.theme.sell, isBest ? 0.5 : 0.15)
          : null;
      case ScalperOrderBookRowType.Bid:
        return hasVolume
          ? ColorHelper.withAlpha(ctx.theme.buyBackgroundLight, isBest ? 0.5 : 0.15)
          : null;
      case ScalperOrderBookRowType.Mixed:
        return ColorHelper.withAlpha(ctx.theme.mix, 0.5);
      case ScalperOrderBookRowType.Spread:
        return ColorHelper.withAlpha(ctx.theme.disabled, 0.07);
      default:
        return null;
    }
  }
}
