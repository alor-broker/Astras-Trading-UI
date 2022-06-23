import { Injectable } from '@angular/core';
import { OrderbookSettings } from 'src/app/shared/models/settings/orderbook-settings.model';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { AnySettings } from '../models/settings/any-settings.model';
import { NewWidget } from '../models/new-widget.model';
import { Widget } from '../models/widget.model';
import { LightChartSettings } from '../models/settings/light-chart-settings.model';
import { TimeframesHelper, TimeframeValue } from 'src/app/modules/light-chart/utils/timeframes-helper';
import { allInstrumentsColumns, InstrumentSelectSettings } from '../models/settings/instrument-select-settings.model';
import { Instrument } from '../models/instruments/instrument.model';
import {
  allOrdersColumns,
  allPositionsColumns,
  allStopOrdersColumns,
  allTradesColumns,
  BlotterSettings
} from '../models/settings/blotter-settings.model';
import { PortfolioKey } from '../models/portfolio-key.model';
import { WidgetNames } from '../models/enums/widget-names';
import { CurrencyInstrument } from '../models/enums/currencies.model';
import { InfoSettings } from '../models/settings/info-settings.model';
import { Store } from '@ngrx/store';
import { getSelectedInstrument } from '../../store/instruments/instruments.selectors';
import { getSelectedPortfolio } from '../../store/portfolios/portfolios.selectors';
import { defaultInstrument } from '../../store/instruments/instruments.reducer';
import { AllTradesSettings } from "../models/settings/all-trades-settings.model";
import { NewsSettings } from "../models/settings/news-settings.model";

@Injectable({
  providedIn: 'root',
})
export class WidgetFactoryService {

  // TODO: Make the method createNewSettings asynchronous to avoid the need for synchronization with local state
  private selectedInstrument: Instrument = {
    ...defaultInstrument
  };

  private selectedPortfolio: PortfolioKey | null = null;

  constructor(private store: Store) {
    this.store.select(getSelectedInstrument).subscribe(
      (si) => (this.selectedInstrument = si)
    );
    this.store.select(getSelectedPortfolio).subscribe(
      (sp) => (this.selectedPortfolio = sp)
    );
  }

  createNewSettings(
    newWidget: NewWidget | Widget,
    additionalSettings?: AnySettings
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
      case WidgetNames.instrumentInfo:
        settings = this.createInfo(newWidget);
        break;
      case WidgetNames.allTrades:
        settings = this.createAllTrades(newWidget);
        break;
      case WidgetNames.news:
        settings = this.createNews(newWidget);
        break;
    }
    if (settings) {
      return { ...settings, ...additionalSettings };
    }
    else throw new Error(`Unknow widget type ${newWidget.gridItem.type}`);
  }

  private createOrderbook(newWidget: NewWidget | Widget): OrderbookSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }
    const group = this.selectedInstrument.instrumentGroup;

    const settings: OrderbookSettings = {
      ...this.selectedInstrument,
      guid: newWidget.gridItem.label,
      linkToActive: true,
      depth: 10,
      title: `Стакан ${this.selectedInstrument.symbol} ${group ? '(' + group + ')' : ''}`,
      showChart: true,
      showTable: true,
      showYieldForBonds: false
    };

    return settings;
  }

  private createInstrumentSelect(newWidget: NewWidget | Widget): InstrumentSelectSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }
    const settings: InstrumentSelectSettings = {
      guid: newWidget.gridItem.label,
      title: `Выбор инструмента`,
      instrumentColumns: allInstrumentsColumns.filter(c => c.isDefault).map(c => c.columnId)
    };

    return settings;
  }

  private createLightChartWidget(
    newWidget: NewWidget | Widget
  ): LightChartSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    const group = this.selectedInstrument.instrumentGroup;
    const settings: LightChartSettings = {
      ...this.selectedInstrument,
      linkToActive: true,
      guid: newWidget.gridItem.label,
      timeFrame: TimeframesHelper.getTimeframeByValue(TimeframeValue.Day)?.value,
      title: `График ${this.selectedInstrument.symbol} ${group ? '(' + group + ')' : ''}`,
      width: 300,
      height: 300
    };

    return settings;
  }

  private createBlotter(newWidget: NewWidget | Widget): BlotterSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }
    const settings: BlotterSettings = {
      ...(this.selectedPortfolio ?? { portfolio: 'D', exchange: 'MOEX' }),
      activeTabIndex: 0,
      guid: newWidget.gridItem.label,
      currency: CurrencyInstrument.USD,
      tradesColumns: allTradesColumns.filter(c => c.isDefault).map(c => c.columnId),
      positionsColumns: allPositionsColumns.filter(c => c.isDefault).map(c => c.columnId),
      ordersColumns: allOrdersColumns.filter(c => c.isDefault).map(c => c.columnId),
      stopOrdersColumns: allStopOrdersColumns.filter(c => c.isDefault).map(c => c.columnId),
      linkToActive: true,
      title: `Блоттер ${this.selectedPortfolio?.portfolio ?? 'D'} ${this.selectedPortfolio?.exchange ?? 'MOEX'}`,
      isSoldPositionsHidden: true
    };

    return settings;
  }

  private createInfo(
    newWidget: NewWidget | Widget
  ): InfoSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }
    const settings: InfoSettings = {
      ...this.selectedInstrument,
      linkToActive: true,
      guid: newWidget.gridItem.label,
      title: `Инфо ${this.selectedInstrument.symbol}`,
    };

    return settings;
  }

  private createAllTrades(newWidget: NewWidget | Widget): AllTradesSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      ...this.selectedInstrument,
      linkToActive: true,
      guid: newWidget.gridItem.label,
      hasSettings: false,
      hasHelp: false,
      title: `Все сделки ${this.selectedInstrument.symbol}`
    };
  }

  private createNews(newWidget: NewWidget | Widget): NewsSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      guid: newWidget.gridItem.label,
      hasSettings: false,
      hasHelp: false,
      title: 'Новости'
    };
  }
}
