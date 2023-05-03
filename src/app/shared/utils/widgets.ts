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
      case WidgetNames.treemap:
        return 'layout';
      case WidgetNames.ribbon:
        return 'stock';
      case WidgetNames.optionBoard:
        return 'table';
      default:
        return '';
    }
  }

  static getWidgetHeaderTranslateKey(widgetName: WidgetNames): string {
    switch (widgetName) {
      case WidgetNames.instrumentSelect:
        return 'InstrumentSelectSettings';
      case WidgetNames.orderBook:
        return 'OrderbookSettings';
      case WidgetNames.scalperOrderBook:
        return 'ScalperOrderBookSettings';
      case WidgetNames.lightChart:
        return 'LightChartSettings';
      case WidgetNames.techChart:
        return 'TechChartSettings';
      case WidgetNames.blotter:
        return 'BlotterSettings';
      case WidgetNames.instrumentInfo:
        return 'InfoSettings';
      case WidgetNames.news:
        return 'NewsSettings';
      case WidgetNames.allTrades:
        return 'AllTradesSettings';
      case WidgetNames.exchangeRate:
        return 'ExchangeRateSettings';
      case WidgetNames.allInstruments:
        return 'AllInstrumentsSettings';
      case WidgetNames.orderSubmit:
        return 'OrderSubmitSettings';
      case WidgetNames.ordersBasket:
        return 'OrdersBasketSettings';
      case WidgetNames.treemap:
        return 'TreemapSettings';
      case WidgetNames.ribbon:
        return 'RibbonSettings';
      case WidgetNames.optionBoard:
        return 'OptionBoardSettings';
      default:
        return '';
    }
  }
}
