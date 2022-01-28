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
import { WidgetNames } from '../models/enums/widget-names';

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
      case WidgetNames.orderBook:
        widget = this.createOrderbook(newWidget);
        break;
      case WidgetNames.lightChart:
        widget = this.createLightChartWidget(newWidget);
        break;
      case WidgetNames.instrumentSelect:
        widget = this.createInstrumentSelect(newWidget);
        break;
      case WidgetNames.blotter:
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
    const group = this.selectedInstrument.instrumentGroup;

    const settings: OrderbookSettings = {
      ...this.selectedInstrument,
      guid: newWidget.gridItem.label,
      linkToActive: true,
      depth: 10,
      title:  `Стакан ${this.selectedInstrument.symbol} ${group ? group : ''}`
    };

    const widget = {
      gridItem: newWidget.gridItem,
      settings: settings,
    };

    return widget;
  }

  private createInstrumentSelect(
    newWidget: NewWidget | Widget<InstrumentSelectSettings>
  ) {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }
    const settings: InstrumentSelectSettings = {
      title: `Выбор инструмента`
    };
    const widget = {
      gridItem: newWidget.gridItem,
      settings: settings,
    };

    return widget;
  }

  private createLightChartWidget(
    newWidget: NewWidget | Widget<LightChartSettings>
  ) {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    const group = this.selectedInstrument.instrumentGroup;
    const settings: LightChartSettings = {
      ...this.selectedInstrument,
      linkToActive: true,
      timeFrame: this.tfHelper.getValueByTfLabel('H')?.value,
      from: this.tfHelper.getDefaultFrom('H'),
      title:  `График ${this.selectedInstrument.symbol} ${group ? group : ''}`
    };

    const widget = {
      gridItem: newWidget.gridItem,
      settings: settings,
    };

    return widget;
  }

  private createBlotter(newWidget: NewWidget | Widget<BlotterSettings>) {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }
    if (this.selectedPortfolio) {
      const settings: BlotterSettings = {
        ...this.selectedPortfolio,
        linkToActive: true,
        title: `Блоттер ${this.selectedPortfolio.portfolio} ${this.selectedPortfolio.exchange}`,
      };
      const widget = {
        gridItem: newWidget.gridItem,
        settings: settings,
      };

      return widget;
    }
    throw Error('Portfolio is not selected')
  }
}
