import {ScalperOrderBookWidgetSettings} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';

/**
 * Настройки виджета scalper-orderbook-2.
 *
 * Виджет использует ту же модель настроек, что и scalper-order-book:
 * это позволяет переиспользовать форму настроек, сервисы чтения/записи
 * и общие per-instrument настройки (remote storage группа scob-ils).
 */
export type ScalperOrderBook2WidgetSettings = ScalperOrderBookWidgetSettings;
