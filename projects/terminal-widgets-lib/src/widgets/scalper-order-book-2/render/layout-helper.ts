import {
  PanelRect,
  RenderLayoutSettings,
  RenderPanelId
} from './render-contracts';

/**
 * Минимально видимая ширина сжимаемых секций (сделки, кластеры) в px.
 * Каждая секция остается минимально видной при сильном сжатии.
 */
export const MIN_VISIBLE_PANEL_WIDTH = 24;

/** Жесткий минимум таблицы стакана, если ширина содержимого еще не измерена. */
export const TABLE_HARD_MIN_WIDTH = 60;

/** Ширины секций по умолчанию в процентах. */
export const DEFAULT_PANEL_WIDTHS: Record<string, number> = {
  [RenderPanelId.OrderBookTable]: 50,
  [RenderPanelId.Trades]: 25,
  [RenderPanelId.TradeClusters]: 25
};

export interface PanelRects {
  clusters: PanelRect | null;
  trades: PanelRect | null;
  table: PanelRect;
}

/** Ограничения компоновки, зависящие от содержимого. */
export interface PanelLayoutConstraints {
  /** Ширина таблицы стакана по содержимому (объем + цена + заявки), чтобы показать ее целиком. */
  tableContentWidth: number;
}

/**
 * Расчет геометрии вертикальных секций (кластеры | сделки | таблица).
 *
 * Таблица стакана имеет приоритет и всегда показывается целиком (ширина >= содержимого),
 * прижата к правому краю. При нехватке места первой сжимается панель сделок, затем
 * кластеров - каждая до минимально видимой ширины. Если даже минимумы не помещаются,
 * левые секции уходят за левый край (отрицательная X), таблица остается видна справа.
 *
 * Используется и фасадом отрисовки, и Angular частью (resize-ручки, линейка),
 * поэтому при одинаковых входных данных дает одинаковый результат.
 */
export class LayoutHelper {
  static getVisiblePanels(settings: RenderLayoutSettings): RenderPanelId[] {
    const visiblePanels: RenderPanelId[] = [];
    if (settings.showClustersPanel) {
      visiblePanels.push(RenderPanelId.TradeClusters);
    }

    if (settings.showTradesPanel) {
      visiblePanels.push(RenderPanelId.Trades);
    }

    visiblePanels.push(RenderPanelId.OrderBookTable);

    return visiblePanels;
  }

  static computePanelRects(
    settings: RenderLayoutSettings,
    width: number,
    constraints?: PanelLayoutConstraints
  ): PanelRects {
    const visiblePanels = this.getVisiblePanels(settings);
    const tableMin = Math.max(TABLE_HARD_MIN_WIDTH, constraints?.tableContentWidth ?? 0);

    // Предпочтительные ширины из сохраненных процентов, нормированные к полной ширине.
    const requestedWidths = visiblePanels.map(id => {
      const saved = settings.widths[id];
      return saved != null && saved >= 0 ? saved : DEFAULT_PANEL_WIDTHS[id];
    });
    const totalRequested = requestedWidths.reduce((acc, curr) => acc + curr, 0);

    const widths = new Map<string, number>();
    visiblePanels.forEach((id, i) => {
      const pct = totalRequested > 0
        ? requestedWidths[i] / totalRequested
        : 1 / visiblePanels.length;
      widths.set(id, width > 0 ? pct * width : 0);
    });

    // Приоритет таблицы: ее ширина не меньше ширины содержимого.
    const tablePref = widths.get(RenderPanelId.OrderBookTable) ?? 0;
    widths.set(RenderPanelId.OrderBookTable, Math.max(tablePref, Math.min(tableMin, width)));

    // Сжатие при переполнении: сначала сделки, затем кластеры (таблица защищена,
    // в порядок сжатия не входит). Каждая секция сжимается до минимально видимой.
    const shrinkMin = Math.min(MIN_VISIBLE_PANEL_WIDTH, width);
    let overflow = this.sum(widths) - width;
    const shrinkOrder = [RenderPanelId.Trades, RenderPanelId.TradeClusters]
      .filter(id => widths.has(id));

    for (const id of shrinkOrder) {
      if (overflow <= 0) {
        break;
      }

      const current = widths.get(id)!;
      const canShrink = Math.max(0, current - shrinkMin);
      const shrink = Math.min(canShrink, overflow);
      widths.set(id, current - shrink);
      overflow -= shrink;
    }

    // Позиционирование: правый якорь. При остаточном переполнении смещение отрицательное,
    // и левые секции уходят за левый край.
    const layoutSum = this.sum(widths);
    let x = width - layoutSum;

    const rects = new Map<string, PanelRect>();
    for (const id of visiblePanels) {
      const panelWidth = widths.get(id) ?? 0;
      rects.set(id, {x, width: panelWidth});
      x += panelWidth;
    }

    return {
      clusters: rects.get(RenderPanelId.TradeClusters) ?? null,
      trades: rects.get(RenderPanelId.Trades) ?? null,
      table: rects.get(RenderPanelId.OrderBookTable) ?? {x: 0, width: width}
    };
  }

  private static sum(widths: Map<string, number>): number {
    let total = 0;
    widths.forEach(value => {
      total += value;
    });

    return total;
  }
}
