import { Injectable } from '@angular/core';
import { NewWidget } from '../models/new-widget.model';
import { Widget } from '../models/widget.model';

@Injectable({
  providedIn: 'root'
})
export class WidgetFactoryService {

constructor() { }
  createNewWidget(newWidget: NewWidget | Widget) : Widget {
    let widget : Widget | null = null
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

  private createOrderbookService(newWidget: NewWidget | Widget) {
    const settings = {
      symbol: 'GAZP',
      exchange: 'MOEX'
    }
    const widget = {
      gridItem: newWidget.gridItem,
      title: `Стакан ${'SBER'}`,
      settings: settings as object
    }
    if (this.isWidget(newWidget)) {
      widget.settings = newWidget.settings;
      // widget.title = `Стакан ${newWidget.settings.symbol}`
    }

    return widget;
  }

  private isWidget(newWidget: NewWidget | Widget): newWidget is Widget {
    return newWidget &&
      'title' in newWidget &&
      'settings' in newWidget;
  }
}
