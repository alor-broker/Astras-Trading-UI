import {
  Container,
  Graphics
} from 'pixi.js';
import {CurrentOrderDisplay} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {
  DirtyFlags,
  FrameContext
} from '../render-contracts';
import {ColorHelper} from '../color-helper';
import {RenderElement} from './render-element';
import {BitmapTextPool} from './bitmap-text-pool';

const TEXT_PADDING = 8;

/** Цвет рамки строки с заявками (в DOM версии используется literal red). */
const ORDERS_ROW_BORDER_COLOR = 0xff0000;

/**
 * Колонка цен таблицы стакана: значения цены, маркер диапазона текущей позиции
 * (цветная полоса у правого края: зеленая - прибыльная зона, красная - убыточная),
 * рамка строк с собственными заявками.
 */
export class PriceColumnElement implements RenderElement {
  readonly container = new Container();

  readonly interestMask = DirtyFlags.Rows
    | DirtyFlags.Orders
    | DirtyFlags.Theme
    | DirtyFlags.Settings
    | DirtyFlags.Layout
    | DirtyFlags.Viewport;

  private readonly graphics = new Graphics();

  private readonly textPool: BitmapTextPool;

  constructor() {
    this.container.addChild(this.graphics);
    this.textPool = new BitmapTextPool(this.container);
  }

  update(ctx: FrameContext): void {
    const g = this.graphics;
    g.clear();
    this.textPool.beginFrame();

    const range = ctx.visibleRange;
    if (range == null) {
      this.textPool.endFrame();
      return;
    }

    const column = ctx.layout.tableColumns.price;
    const rowHeight = ctx.viewport.rowHeight;
    const fontSize = ctx.viewport.fontSize;
    const decimals = ctx.model.displaySettings.priceDecimalsCount;

    for (let i = range.start; i <= range.end && i < ctx.model.rows.length; i++) {
      const row = ctx.model.rows[i];
      const y = (i * rowHeight) - ctx.viewport.scrollOffset;

      // Маркер диапазона текущей позиции.
      const positionSign = row.currentPositionRangeSign ?? 0;
      if (positionSign !== 0) {
        const stripeFill = positionSign > 0 ? ctx.theme.buy : ctx.theme.sell;
        g.rect(column.x + column.width - 3, y, 3, rowHeight).fill(stripeFill);
      }

      // Рамка строки, на которой есть собственные заявки.
      if (this.hasOrders(ctx, row.baseRange.min, row.baseRange.max)) {
        g.rect(column.x, y, column.width, 1).fill({color: ORDERS_ROW_BORDER_COLOR, alpha: 1});
        g.rect(column.x, y + rowHeight - 1, column.width, 1).fill({color: ORDERS_ROW_BORDER_COLOR, alpha: 1});
      }

      const textFill = row.isMajorLinePrice
        ? ctx.theme.textMaxContrast
        : ColorHelper.withAlpha(ctx.theme.textMaxContrast, 0.8);

      this.textPool.place(
        ctx.fonts,
        ctx.formatters.formatPrice(row.price, decimals),
        fontSize,
        textFill,
        column.x + column.width - TEXT_PADDING,
        y + (rowHeight / 2),
        1,
        0.5
      );
    }

    this.textPool.endFrame();
  }

  destroy(): void {
    this.textPool.destroy();
    this.graphics.destroy();
    this.container.destroy();
  }

  private hasOrders(ctx: FrameContext, rangeMin: number, rangeMax: number): boolean {
    return ctx.model.orders.some(order => {
      const price = this.getOrderPrice(order);
      return price != null && price >= rangeMin && price <= rangeMax;
    });
  }

  private getOrderPrice(order: CurrentOrderDisplay): number | null {
    return order.triggerPrice ?? order.price ?? null;
  }
}
