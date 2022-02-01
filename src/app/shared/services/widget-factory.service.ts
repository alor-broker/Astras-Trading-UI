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
import { allOrdersColumns, allPositionsColumns, allTradesColumns, BlotterSettings } from '../models/settings/blotter-settings.model';
import { PortfolioKey } from '../models/portfolio-key.model';
import { WidgetNames } from '../models/enums/widget-names';

@Injectable({
  providedIn: 'root',
})
export class WidgetFactoryService {
  private tfHelper = new TimeframesHelper();
  private selectedInstrument: InstrumentKey = {
    symbol: 'GAZP',
    instrumentGroup: 'TQBR',
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

  createNewSettings(
    newWidget: NewWidget | Widget
  ): AnySettings {
    let settings: AnySettings | null = null;
    switch (newWidget.gridItem.type) {
      case WidgetNames.orderBook:
        settings = this.createOrderbook(newWidget);
        break;
      case WidgetNames.lightChart:
        settings = this.createLightChartWidget(newWidget);
        break;
      case WidgetNames.instrumentSelect:
        settings = this.createInstrumentSelect(newWidget);
        break;
      case WidgetNames.blotter:
        settings = this.createBlotter(newWidget);
        break;
    }
    if (settings) {
      return settings;
    } else throw new Error(`Unknow widget type ${newWidget.gridItem.type}`);
  }

  private createOrderbook(newWidget: NewWidget | Widget) : OrderbookSettings {
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

    return settings;
  }

  private createInstrumentSelect(newWidget: NewWidget | Widget) : InstrumentSelectSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }
    const settings: InstrumentSelectSettings = {
      guid: newWidget.gridItem.label,
      title: `Выбор инструмента`
    };

    return settings;
  }

  private createLightChartWidget(
    newWidget: NewWidget | Widget
  ) : LightChartSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    const group = this.selectedInstrument.instrumentGroup;
    const settings: LightChartSettings = {
      ...this.selectedInstrument,
      linkToActive: true,
      guid: newWidget.gridItem.label,
      timeFrame: this.tfHelper.getValueByTfLabel('H')?.value,
      from: this.tfHelper.getDefaultFrom('H'),
      title:  `График ${this.selectedInstrument.symbol} ${group ? group : ''}`
    };

    return settings;
  }

  private createBlotter(newWidget: NewWidget | Widget) : BlotterSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }
    if (this.selectedPortfolio) {
      const settings: BlotterSettings = {
        ...this.selectedPortfolio,
        guid: newWidget.gridItem.label,
        tradesColumns: allTradesColumns.map(c => c.columnId),
        positionsColumns: allPositionsColumns.map(c => c.columnId),
        ordersColumns: allOrdersColumns.map(c => c.columnId),
        linkToActive: true,
        title: `Блоттер ${this.selectedPortfolio.portfolio} ${this.selectedPortfolio.exchange}`,
      };

      return settings;
    }
    throw Error('Portfolio is not selected')
  }
}
