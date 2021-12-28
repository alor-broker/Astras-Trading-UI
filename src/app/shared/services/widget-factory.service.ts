import { Injectable } from '@angular/core';
import { OrderbookSettings } from 'src/app/shared/models/settings/orderbook-settings.model';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { AnySettings } from '../models/settings/any-settings.model';
import { NewWidget } from '../models/new-widget.model';
import { Widget } from '../models/widget.model';
import { LightChartSettings } from '../models/settings/light-chart-settings.model';
import { TimeframesHelper } from 'src/app/modules/light-chart/utils/timeframes-helper';
import { InstrumentSelectSettings } from '../models/settings/instrument-select-settings.model';
import { SyncService } from './sync.service';
import { InstrumentKey } from '../models/instruments/instrument-key.model';
import { BlotterSettings } from '../models/settings/blotter-settings.model';
import { PortfolioKey } from '../models/portfolio-key.model';

@Injectable({
  providedIn: 'root',
})
export class WidgetFactoryService {
  private tfHelper = new TimeframesHelper();
  private selectedInstrument: InstrumentKey = {
    symbol: 'GAZP',
    exchange: 'MOEX',
  };
  private selectedPortfolio: PortfolioKey | null = null;

  constructor(private sync: SyncService) {
    this.sync.selectedInstrument$.subscribe(
      (si) => (this.selectedInstrument = si)
    );
    this.sync.selectedPortfolio$.subscribe(
      (sp) => (this.selectedPortfolio = sp)
    )
  }

  createNewWidget(
    newWidget: NewWidget | Widget<AnySettings>
  ): Widget<AnySettings> {
    let widget: Widget<AnySettings> | null = null;
    switch (newWidget.gridItem.type) {
      case 'order-book':
        widget = this.createOrderbook(newWidget);
        break;
      case 'light-chart':
        widget = this.createLightChartWidget(newWidget);
        break;
      case 'instrument-select':
        widget = this.createInstrumentSelect(newWidget);
        break;
      case 'blotter':
        widget = this.createBlotter(newWidget);
        break;
    }
    if (widget) {
      return widget;
    } else throw new Error(`Unknow widget type ${newWidget.gridItem.type}`);
  }

  private createOrderbook(newWidget: NewWidget | Widget<OrderbookSettings>) {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }
    const settings: OrderbookSettings = {
      ...this.selectedInstrument,
      depth: 7
    };
    const widget = {
      gridItem: newWidget.gridItem,
      title: `Стакан ${settings.symbol}`,
      settings: settings,
    };
    if (this.isWidget(newWidget)) {
      widget.settings = newWidget.settings;
      const hasGroup = widget.settings.instrumentGroup;
      widget.title = `Стакан ${newWidget.settings.symbol} ${
        hasGroup ? `(${widget.settings.instrumentGroup})` : ''
      }`;
    }

    return widget;
  }

  private createInstrumentSelect(
    newWidget: NewWidget | Widget<InstrumentSelectSettings>
  ) {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }
    const settings: InstrumentSelectSettings = {};
    const widget = {
      gridItem: newWidget.gridItem,
      title: `Выбор инструмента`,
      settings: settings,
    };
    if (this.isWidget(newWidget)) {
      widget.settings = newWidget.settings;
      widget.title = `Выбор инструмента`;
    }

    return widget;
  }

  private createLightChartWidget(
    newWidget: NewWidget | Widget<LightChartSettings>
  ) {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }
    const settings: LightChartSettings = {
      ...this.selectedInstrument,
      timeFrame: this.tfHelper.getValueByTfLabel('H')?.value,
      from: this.tfHelper.getDefaultFrom('H'),
    };
    const widget = {
      gridItem: newWidget.gridItem,
      title: `График ${settings.symbol}`,
      settings: settings,
    };
    if (this.isWidget(newWidget)) {
      widget.settings = newWidget.settings;
      const hasGroup = widget.settings.instrumentGroup;
      widget.title = `График ${newWidget.settings.symbol} ${
        hasGroup ? `(${widget.settings.instrumentGroup})` : ''
      }`;
    }

    return widget;
  }


  private createBlotter(newWidget: NewWidget | Widget<BlotterSettings>) {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }
    if (this.selectedPortfolio) {
      const settings: BlotterSettings = {
        ...this.selectedPortfolio
      };
      const widget = {
        gridItem: newWidget.gridItem,
        title: `Блоттер ${settings.portfolio} ${settings.exchange}`,
        settings: settings,
      };
      if (this.isWidget(newWidget)) {
        widget.settings = newWidget.settings;
        widget.title = `Блоттер ${widget.settings.portfolio} ${widget.settings.exchange}`;
      }

      return widget;
    }
    throw Error('Portfolio is not selected')
  }

  private isWidget<T>(
    newWidget: NewWidget | Widget<T>
  ): newWidget is Widget<T> {
    return newWidget && 'title' in newWidget && 'settings' in newWidget;
  }
}
