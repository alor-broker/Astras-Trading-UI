import { Injectable } from '@angular/core';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { NewWidget } from '../../../shared/models/new-widget.model';
import { Widget } from '../../../shared/models/widget.model';
import { OrderbookSettings } from '../../orderbook/models/orderbook-settings.model';
import { AnySettings } from '../models/any-settings.model';

@Injectable({
  providedIn: 'root'
})
export class WidgetFactoryService {

constructor() { }
  createNewWidget(newWidget: NewWidget | Widget<AnySettings>) : Widget<AnySettings> {
    let widget : Widget<AnySettings> | null = null
    switch (newWidget.gridItem.type) {
      case 'order-book':
        widget = this.createOrderbookService(newWidget)
        break;
    }
    if (widget) {
      return widget;
    }
    else throw new Error(`Unknow widget type ${newWidget.gridItem.type}`)
  }

  private createOrderbookService(newWidget: NewWidget | Widget<AnySettings>) {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }
    const settings : OrderbookSettings = {
      symbol: 'GAZP',
      exchange: 'MOEX'
    }
    const widget = {
      gridItem: newWidget.gridItem,
      title: `Стакан ${settings.symbol}`,
      settings: settings
    }
    if (this.isWidget(newWidget)) {
      widget.settings = newWidget.settings;
      widget.title = `Стакан ${newWidget.settings.symbol}`
    }

    return widget;
  }

  private isWidget<T>(newWidget: NewWidget | Widget<T>): newWidget is Widget<T> {
    return newWidget &&
      'title' in newWidget &&
      'settings' in newWidget;
  }
}
