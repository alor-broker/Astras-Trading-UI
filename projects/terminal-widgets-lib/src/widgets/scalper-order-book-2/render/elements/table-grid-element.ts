import {
  Container,
  Graphics
} from 'pixi.js';
import {
  DirtyFlags,
  FrameContext
} from '../render-contracts';
import {RenderElement} from './render-element';

/**
 * Линии сетки таблицы стакана: горизонтальные minor/major линии на ценовых уровнях
 * и вертикальные разделители колонок.
 */
export class TableGridElement implements RenderElement {
  readonly container = new Container();

  readonly interestMask = DirtyFlags.Rows
    | DirtyFlags.Theme
    | DirtyFlags.Layout
    | DirtyFlags.Viewport;

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
    const lineColor = ctx.theme.tableBorder;

    // Горизонтальные линии уровней цены.
    for (let i = range.start; i <= range.end && i < ctx.model.rows.length; i++) {
      const row = ctx.model.rows[i];
      if (!row.isMinorLinePrice && !row.isMajorLinePrice) {
        continue;
      }

      const y = (i * rowHeight) - ctx.viewport.scrollOffset + Math.ceil(rowHeight / 2);

      g.moveTo(0, y);
      g.lineTo(width, y);
      g.stroke({
        width: row.isMajorLinePrice ? 2 : 1,
        color: lineColor.color,
        alpha: lineColor.alpha
      });
    }

    // Вертикальные разделители колонок.
    const columns = ctx.layout.tableColumns;
    const separators = [
      columns.price.x,
      columns.orders.x,
      columns.orders.x + columns.orders.width
    ];

    for (const x of separators) {
      g.moveTo(x, 0);
      g.lineTo(x, ctx.viewport.height);
      g.stroke({
        width: 1,
        color: lineColor.color,
        alpha: lineColor.alpha
      });
    }
  }

  destroy(): void {
    this.graphics.destroy();
    this.container.destroy();
  }
}
