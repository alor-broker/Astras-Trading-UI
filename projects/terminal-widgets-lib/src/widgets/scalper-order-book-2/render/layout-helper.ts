import {
  PanelRect,
  RenderLayoutSettings,
  RenderPanelId
} from './render-contracts';

/** Минимальные ширины секций в px. */
export const MIN_PANEL_WIDTHS_PX: Record<string, number> = {
  [RenderPanelId.OrderBookTable]: 75,
  [RenderPanelId.Trades]: 40,
  [RenderPanelId.TradeClusters]: 20
};

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

/**
 * Расчет геометрии вертикальных секций (кластеры | сделки | таблица).
 * Используется и фасадом отрисовки, и Angular частью (позиции resize-ручек),
 * чтобы геометрия всегда совпадала.
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

  static computePanelRects(settings: RenderLayoutSettings, width: number): PanelRects {
    const visiblePanels = this.getVisiblePanels(settings);

    // Нормализация процентов видимых секций к 100%.
    const requestedWidths = visiblePanels.map(id => {
      const saved = settings.widths[id];
      return saved != null && saved >= 0 ? saved : DEFAULT_PANEL_WIDTHS[id];
    });

    const totalRequested = requestedWidths.reduce((acc, curr) => acc + curr, 0);
    const normalizedWidths = totalRequested > 0
      ? requestedWidths.map(w => (w / totalRequested) * 100)
      : visiblePanels.map(() => 100 / visiblePanels.length);

    // Перевод в px с учетом минимальных ширин.
    // Нулевая ширина означает схлопнутую секцию (разворачивание соседней панели) -
    // минимальная ширина к ней не применяется.
    const pxWidths = normalizedWidths.map((w, i) => {
      if (w <= 0) {
        return 0;
      }

      const minWidth = MIN_PANEL_WIDTHS_PX[visiblePanels[i]];
      return Math.max(width > 0 ? (w / 100) * width : 0, Math.min(minWidth, width));
    });

    const rects = new Map<string, PanelRect>();
    let x = 0;
    for (let i = 0; i < visiblePanels.length; i++) {
      const isLast = i === visiblePanels.length - 1;
      const panelWidth = isLast ? Math.max(0, width - x) : pxWidths[i];
      rects.set(visiblePanels[i], {x, width: panelWidth});
      x += panelWidth;
    }

    return {
      clusters: rects.get(RenderPanelId.TradeClusters) ?? null,
      trades: rects.get(RenderPanelId.Trades) ?? null,
      table: rects.get(RenderPanelId.OrderBookTable) ?? {x: 0, width: width}
    };
  }
}
