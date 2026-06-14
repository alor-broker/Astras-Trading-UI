import {
  Container,
  Graphics
} from 'pixi.js';
import {CurrentOrderDisplay} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {OrderType} from '@terminal-core-lib/features/orders/types/orders.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {
  DirtyFlags,
  FillSpec,
  FrameContext,
  OrderIndicatorHitArea
} from '../render-contracts';
import {RenderElement} from './render-element';
import {BitmapTextPool} from './bitmap-text-pool';

interface OrdersGroup {
  orders: CurrentOrderDisplay[];
  volume: number;
  type: OrderType;
}

const INDICATOR_PADDING_X = 4;

const INDICATOR_GAP = 2;

/**
 * Колонка собственных заявок: индикаторы лимитных (объем), стоп-лимит "SL(объем)"
 * и стоп-маркет "SM(объем)" заявок с группировкой по типу на уровне цены.
 * Формирует области попадания для отмены кликом и переноса перетаскиванием,
 * отрисовывает "призрак" перетаскиваемой группы.
 */
export class OrdersColumnElement implements RenderElement {
  readonly container = new Container();

  readonly interestMask = DirtyFlags.Rows
    | DirtyFlags.Orders
    | DirtyFlags.Theme
    | DirtyFlags.Settings
    | DirtyFlags.Layout
    | DirtyFlags.Viewport
    | DirtyFlags.Drag;

  /** Области попадания индикаторов в абсолютных координатах канвы. */
  hitAreas: OrderIndicatorHitArea[] = [];

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
    this.hitAreas = [];

    const range = ctx.visibleRange;
    if (range == null) {
      this.textPool.endFrame();
      return;
    }

    const orders = ctx.model.orders;
    if (orders.length > 0) {
      let minOrderPrice = Number.MAX_VALUE;
      let maxOrderPrice = -Number.MAX_VALUE;
      for (const order of orders) {
        const price = order.triggerPrice ?? order.price ?? null;
        if (price == null) {
          continue;
        }

        minOrderPrice = Math.min(minOrderPrice, price);
        maxOrderPrice = Math.max(maxOrderPrice, price);
      }

      for (let i = range.start; i <= range.end && i < ctx.model.rows.length; i++) {
        const row = ctx.model.rows[i];
        if (row.baseRange.max < minOrderPrice || row.baseRange.min > maxOrderPrice) {
          continue;
        }

        const rowOrders = orders.filter(order => {
          const price = order.triggerPrice ?? order.price ?? null;
          return price != null && price >= row.baseRange.min && price <= row.baseRange.max;
        });

        if (rowOrders.length === 0) {
          continue;
        }

        this.drawRowIndicators(ctx, i, rowOrders, false);
      }
    }

    // Призрак перетаскиваемой группы заявок на целевой строке.
    const dragState = ctx.dragState;
    if (dragState != null
      && dragState.currentRowIndex >= range.start
      && dragState.currentRowIndex <= range.end) {
      this.drawRowIndicators(ctx, dragState.currentRowIndex, dragState.orders, true);
    }

    this.textPool.endFrame();
  }

  destroy(): void {
    this.textPool.destroy();
    this.graphics.destroy();
    this.container.destroy();
  }

  private drawRowIndicators(
    ctx: FrameContext,
    rowIndex: number,
    rowOrders: CurrentOrderDisplay[],
    isGhost: boolean
  ): void {
    const column = ctx.layout.tableColumns.orders;
    const rowHeight = ctx.viewport.rowHeight;
    const fontSize = ctx.viewport.fontSize;
    const y = (rowIndex * rowHeight) - ctx.viewport.scrollOffset;

    const groups: { group: OrdersGroup, text: string, hasBackground: boolean }[] = [];

    const limitGroup = this.getOrdersGroup(rowOrders, OrderType.Limit);
    if (limitGroup != null) {
      groups.push({
        group: limitGroup,
        text: this.appendMultipleMarker(`${limitGroup.volume}`, limitGroup),
        hasBackground: true
      });
    }

    const stopLimitGroup = this.getOrdersGroup(rowOrders, OrderType.StopLimit);
    if (stopLimitGroup != null) {
      groups.push({
        group: stopLimitGroup,
        text: this.appendMultipleMarker(`SL(${stopLimitGroup.volume})`, stopLimitGroup),
        hasBackground: false
      });
    }

    const stopMarketGroup = this.getOrdersGroup(rowOrders, OrderType.StopMarket);
    if (stopMarketGroup != null) {
      groups.push({
        group: stopMarketGroup,
        text: this.appendMultipleMarker(`SM(${stopMarketGroup.volume})`, stopMarketGroup),
        hasBackground: false
      });
    }

    let x = column.x + INDICATOR_GAP;
    const alpha = isGhost ? 0.6 : 1;

    for (const item of groups) {
      const textWidth = Math.ceil(ctx.fonts.measureTextWidth(item.text, fontSize));
      const indicatorWidth = textWidth + (INDICATOR_PADDING_X * 2);

      const sideFill = this.getGroupFill(ctx, item.group, item.hasBackground);

      if (item.hasBackground) {
        this.graphics
          .roundRect(x, y + 1, indicatorWidth, rowHeight - 2, 2)
          .fill({color: sideFill.color, alpha: 0.6 * sideFill.alpha * alpha});
      }

      const textFill: FillSpec = item.hasBackground
        ? {color: ctx.theme.textMaxContrast.color, alpha: ctx.theme.textMaxContrast.alpha * alpha}
        : {color: sideFill.color, alpha: sideFill.alpha * alpha};

      this.textPool.place(
        ctx.fonts,
        item.text,
        fontSize,
        textFill,
        x + INDICATOR_PADDING_X,
        y + (rowHeight / 2),
        0,
        0.5
      );

      if (!isGhost) {
        this.hitAreas.push({
          x: ctx.layout.table.x + x,
          y,
          width: indicatorWidth,
          height: rowHeight,
          rowIndex,
          orders: item.group.orders,
          hasDirtyOrders: item.group.orders.some(o => o.isDirty)
        });
      }

      x += indicatorWidth + INDICATOR_GAP;
    }
  }

  private getOrdersGroup(orders: CurrentOrderDisplay[], type: OrderType): OrdersGroup | null {
    const filtered = orders.filter(o => o.type === type);
    if (filtered.length === 0) {
      return null;
    }

    const volume = filtered.reduce((acc, curr) => acc + curr.displayVolume, 0);
    if (volume <= 0) {
      return null;
    }

    return {
      orders: filtered,
      volume,
      type
    };
  }

  private appendMultipleMarker(text: string, group: OrdersGroup): string {
    return group.orders.length > 1 ? `${text}*` : text;
  }

  private getGroupFill(ctx: FrameContext, group: OrdersGroup, isBackgroundFill: boolean): FillSpec {
    if (group.orders.some(o => o.isDirty)) {
      return ctx.theme.disabled;
    }

    const isAllBuy = group.orders.every(o => o.side === Side.Buy);
    if (isAllBuy) {
      return isBackgroundFill ? ctx.theme.buy : ctx.theme.buyAccent;
    }

    const isAllSell = group.orders.every(o => o.side === Side.Sell);
    if (isAllSell) {
      return isBackgroundFill ? ctx.theme.sell : ctx.theme.sellAccent;
    }

    return ctx.theme.mix;
  }
}
