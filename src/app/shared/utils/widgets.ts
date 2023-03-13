import { WidgetNames } from "../models/enums/widget-names";

export class WidgetsHelper {
  static getIconName(widgetName: WidgetNames): string {
    switch (widgetName) {
      case WidgetNames.instrumentSelect:
        return 'eye';
      case WidgetNames.orderBook:
      case WidgetNames.scalperOrderBook:
        return 'ordered-list';
      case WidgetNames.lightChart:
        return 'sliders';
      case WidgetNames.techChart:
        return 'fund';
      case WidgetNames.blotter:
        return 'table';
      case WidgetNames.instrumentInfo:
        return 'info';
      case WidgetNames.news:
        return 'read';
      case WidgetNames.allTrades:
        return 'unordered-list';
      case WidgetNames.exchangeRate:
        return 'line-chart';
      case WidgetNames.allInstruments:
        return 'profile';
      case WidgetNames.orderSubmit:
        return 'send';
      case WidgetNames.ordersBasket:
        return 'calculator';
      default:
        return '';
    }
  }
}
