import { Injectable } from '@angular/core';
import { OrderbookSettings } from 'src/app/shared/models/settings/orderbook-settings.model';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { AnySettings } from '../models/settings/any-settings.model';
import { NewWidget } from '../models/new-widget.model';
import { Widget } from '../models/widget.model';
import { LightChartSettings } from '../models/settings/light-chart-settings.model';
import {
  TimeframesHelper,
  TimeframeValue
} from 'src/app/modules/light-chart/utils/timeframes-helper';
import {
  allInstrumentsColumns,
  InstrumentSelectSettings
} from '../models/settings/instrument-select-settings.model';
import { InstrumentBadges } from '../models/instruments/instrument.model';
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
import { getSelectedInstrumentsWithBadges } from '../../store/instruments/instruments.selectors';
import { getSelectedPortfolio } from '../../store/portfolios/portfolios.selectors';
import { defaultInstrument } from '../../store/instruments/instruments.reducer';
import { AllTradesSettings } from "../models/settings/all-trades-settings.model";
import { NewsSettings } from "../models/settings/news-settings.model";
import { ExchangeRateSettings } from "../models/settings/exchange-rate-settings.model";
import { ScalperOrderBookSettings } from "../models/settings/scalper-order-book-settings.model";
import { TechChartSettings } from "../models/settings/tech-chart-settings.model";
import { AllInstrumentsSettings, allInstrumentsColumns as allInstrumentsCols } from "../models/settings/all-instruments-settings.model";
import { defaultBadgeColor, instrumentsBadges } from "../utils/instruments";
import { OrderSubmitSettings } from "../models/settings/order-submit-settings.model";

@Injectable({
  providedIn: 'root',
})
export class WidgetFactoryService {

  // TODO: Make the method createNewSettings asynchronous to avoid the need for synchronization with local state
  private badges: InstrumentBadges = instrumentsBadges
    .reduce((acc, curr) => {
      acc[curr] = {...defaultInstrument};
      return acc;
    }, {} as InstrumentBadges);

  private selectedPortfolio: PortfolioKey | null = null;

  constructor(private store: Store) {
    this.store.select(getSelectedInstrumentsWithBadges).subscribe(
      (si) => (this.badges = si)
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
      case WidgetNames.scalperOrderBook:
        settings = this.createScalperOrderBook(newWidget);
        break;
      case WidgetNames.lightChart:
        settings = this.createLightChartWidget(newWidget);
        break;
      case WidgetNames.instrumentSelect:
        settings = this.createInstrumentSelect(newWidget);
        break;
      case WidgetNames.allInstruments:
        settings = this.createAllInstruments(newWidget);
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
      case WidgetNames.exchangeRate:
        settings = this.createExchangeRate(newWidget);
        break;
      case WidgetNames.techChart:
        settings = this.createTechChart(newWidget);
        break;
      case WidgetNames.orderSubmit:
        settings = this.createOrderSubmit(newWidget);
        break;
    }
    if (settings) {
      return { ...settings, ...additionalSettings };
    }
    else throw new Error(`Unknown widget type ${newWidget.gridItem.type}`);
  }

  private createOrderbook(newWidget: NewWidget | Widget): OrderbookSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      ...this.badges.yellow,
      guid: newWidget.gridItem.label,
      settingsType: 'OrderbookSettings',
      linkToActive: true,
      badgeColor: defaultBadgeColor,
      depth: 10,
      title: `Стакан`,
      showChart: true,
      showTable: true,
      showYieldForBonds: false,
    } as OrderbookSettings;
  }

  private createScalperOrderBook(newWidget: NewWidget | Widget): ScalperOrderBookSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      ...this.badges.yellow,
      guid: newWidget.gridItem.label,
      settingsType: 'ScalperOrderBookSettings',
      title: `Скальперский стакан`,
      linkToActive: true,
      badgeColor: defaultBadgeColor,
      depth: 10,
      showYieldForBonds: false,
      showZeroVolumeItems: false,
      showSpreadItems: false,
      highlightHighVolume: false,
      volumeHighlightOptions: [{ boundary: 10000, color: '#CC0099' }],
      workingVolumes: [1, 10, 100, 1000],
      disableHotkeys: true,
      enableMouseClickSilentOrders: false
    } as ScalperOrderBookSettings;
  }

  private createInstrumentSelect(newWidget: NewWidget | Widget): InstrumentSelectSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      guid: newWidget.gridItem.label,
      settingsType: 'InstrumentSelectSettings',
      title: `Выбор инструмента`,
      instrumentColumns: allInstrumentsColumns.filter(c => c.isDefault).map(c => c.columnId),
      badgeColor: defaultBadgeColor
    } as InstrumentSelectSettings;
  }

  private createLightChartWidget(
    newWidget: NewWidget | Widget
  ): LightChartSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      ...this.badges.yellow,
      linkToActive: true,
      badgeColor: defaultBadgeColor,
      guid: newWidget.gridItem.label,
      settingsType: 'LightChartSettings',
      timeFrame: TimeframesHelper.getTimeframeByValue(TimeframeValue.Day)?.value,
      title: `График`,
      width: 300,
      height: 300
    } as LightChartSettings;
  }

  private createBlotter(newWidget: NewWidget | Widget): BlotterSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      ...(this.selectedPortfolio ?? { portfolio: 'D', exchange: 'MOEX' }),
      activeTabIndex: 0,
      guid: newWidget.gridItem.label,
      settingsType: 'BlotterSettings',
      currency: CurrencyInstrument.USD,
      tradesColumns: allTradesColumns.filter(c => c.isDefault).map(c => c.columnId),
      positionsColumns: allPositionsColumns.filter(c => c.isDefault).map(c => c.columnId),
      ordersColumns: allOrdersColumns.filter(c => c.isDefault).map(c => c.columnId),
      stopOrdersColumns: allStopOrdersColumns.filter(c => c.isDefault).map(c => c.columnId),
      linkToActive: true,
      badgeColor: defaultBadgeColor,
      title: `Блоттер`,
      isSoldPositionsHidden: true
    } as BlotterSettings;
  }

  private createInfo(
    newWidget: NewWidget | Widget
  ): InfoSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      ...this.badges.yellow,
      linkToActive: true,
      badgeColor: defaultBadgeColor,
      guid: newWidget.gridItem.label,
      settingsType: 'InfoSettings',
      title: `Инфо`,
    } as InfoSettings;
  }

  private createAllTrades(newWidget: NewWidget | Widget): AllTradesSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      ...this.badges.yellow,
      linkToActive: true,
      badgeColor: defaultBadgeColor,
      guid: newWidget.gridItem.label,
      settingsType: 'AllTradesSettings',
      title: `Все сделки`
    } as AllTradesSettings;
  }

  private createNews(newWidget: NewWidget | Widget): NewsSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      guid: newWidget.gridItem.label,
      settingsType: 'NewsSettings',
      title: 'Новости'
    } as NewsSettings;
  }

  private createExchangeRate(newWidget: NewWidget | Widget): ExchangeRateSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      guid: newWidget.gridItem.label,
      settingsType: 'ExchangeRateSettings',
      title: 'Курс валют'
    } as ExchangeRateSettings;
  }

  private createTechChart(newWidget: NewWidget | Widget): TechChartSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      ...this.badges.yellow,
      guid: newWidget.gridItem.label,
      settingsType: 'TechChartSettings',
      title: 'Тех. анализ',
      linkToActive: true,
      badgeColor: defaultBadgeColor,
      chartSettings: {}
    } as TechChartSettings;
  }

  private createAllInstruments(newWidget: NewWidget | Widget): AllInstrumentsSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      guid: newWidget.gridItem.label,
      badgeColor: defaultBadgeColor,
      settingsType: 'AllInstrumentsSettings',
      title: 'Все инструменты',
      allInstrumentsColumns: allInstrumentsCols.filter(c => c.isDefault).map(col => col.columnId)
    } as AllInstrumentsSettings;
  }

  private createOrderSubmit(newWidget: NewWidget | Widget): OrderSubmitSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

      return {
      ...this.badges.yellow,
      guid: newWidget.gridItem.label,
      badgeColor: defaultBadgeColor,
      settingsType: 'OrderSubmitSettings',
      title: 'Выставить заявку',
      linkToActive: true
    } as OrderSubmitSettings;
  }
}
