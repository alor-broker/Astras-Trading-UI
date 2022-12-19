import { Injectable } from '@angular/core';
import { OrderbookSettings } from 'src/app/shared/models/settings/orderbook-settings.model';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { AnySettings } from '../models/settings/any-settings.model';
import { NewWidget } from '../models/new-widget.model';
import { Widget } from '../models/widget.model';
import {
  LightChartSettings,
  TimeFrameDisplayMode
} from '../models/settings/light-chart-settings.model';
import {
  TimeframesHelper
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
import { InfoSettings } from '../models/settings/info-settings.model';
import { Store } from '@ngrx/store';
import { getSelectedInstrumentsWithBadges } from '../../store/instruments/instruments.selectors';
import { getSelectedPortfolioKey } from '../../store/portfolios/portfolios.selectors';
import { defaultInstrument } from '../../store/instruments/instruments.reducer';
import { AllTradesSettings, allTradesWidgetColumns } from "../models/settings/all-trades-settings.model";
import { NewsSettings } from "../models/settings/news-settings.model";
import { ExchangeRateSettings } from "../models/settings/exchange-rate-settings.model";
import {
  ScalperOrderBookSettings,
  VolumeHighlightMode
} from "../models/settings/scalper-order-book-settings.model";
import { TechChartSettings } from "../models/settings/tech-chart-settings.model";
import {
  allInstrumentsColumns as allInstrumentsCols,
  AllInstrumentsSettings
} from "../models/settings/all-instruments-settings.model";
import {
  defaultBadgeColor,
  instrumentsBadges,
  toInstrumentKey
} from "../utils/instruments";
import { OrderSubmitSettings } from "../models/settings/order-submit-settings.model";
import { TimeframeValue } from '../../modules/light-chart/models/light-chart.models';
import { TableSettingHelper } from '../utils/table-setting.helper';

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
    this.store.select(getSelectedPortfolioKey).subscribe(
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
      ...toInstrumentKey(this.badges.yellow),
      guid: newWidget.gridItem.label,
      settingsType: 'OrderbookSettings',
      title: `Стакан`,
      titleIcon: 'ordered-list',
      linkToActive: true,
      badgeColor: defaultBadgeColor,
      depth: 10,
      showChart: true,
      showTable: true,
      showYieldForBonds: false,
      useOrderWidget: false,
      showVolume: false
    } as OrderbookSettings;
  }

  private createScalperOrderBook(newWidget: NewWidget | Widget): ScalperOrderBookSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      ...toInstrumentKey(this.badges.yellow),
      guid: newWidget.gridItem.label,
      settingsType: 'ScalperOrderBookSettings',
      title: `Скальперский стакан`,
      titleIcon: 'ordered-list',
      linkToActive: true,
      badgeColor: defaultBadgeColor,
      depth: 10,
      showZeroVolumeItems: true,
      showSpreadItems: true,
      volumeHighlightMode: VolumeHighlightMode.BiggestVolume,
      volumeHighlightFullness: 10000,
      volumeHighlightOptions: [
        { boundary: 1000, color: '#71DB20' },
        { boundary: 5000, color: '#ff0000' },
        { boundary: 10000, color: '#ff00ff' }
      ],
      workingVolumes: [1, 10, 100, 1000],
      disableHotkeys: true,
      enableMouseClickSilentOrders: false,
      autoAlignIntervalSec: 15,
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
      titleIcon: 'eye',
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
      ...toInstrumentKey(this.badges.yellow),
      linkToActive: true,
      badgeColor: defaultBadgeColor,
      guid: newWidget.gridItem.label,
      settingsType: 'LightChartSettings',
      title: `График`,
      titleIcon: 'sliders',
      timeFrame: TimeframesHelper.getTimeframeByValue(TimeframeValue.Day)?.value,
      timeFrameDisplayMode: TimeFrameDisplayMode.Buttons,
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
      title: `Блоттер`,
      titleIcon: 'table',
      tradesTable: TableSettingHelper.toTableDisplaySettings(allTradesColumns.filter(c => c.isDefault).map(c => c.columnId)),
      positionsTable: TableSettingHelper.toTableDisplaySettings(allPositionsColumns.filter(c => c.isDefault).map(c => c.columnId)),
      ordersTable: TableSettingHelper.toTableDisplaySettings(allOrdersColumns.filter(c => c.isDefault).map(c => c.columnId)),
      stopOrdersTable: TableSettingHelper.toTableDisplaySettings(allStopOrdersColumns.filter(c => c.isDefault).map(c => c.columnId)),
      linkToActive: true,
      badgeColor: defaultBadgeColor,
      isSoldPositionsHidden: true,
      cancelOrdersWithoutConfirmation: false
    } as BlotterSettings;
  }

  private createInfo(
    newWidget: NewWidget | Widget
  ): InfoSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      ...toInstrumentKey(this.badges.yellow),
      linkToActive: true,
      badgeColor: defaultBadgeColor,
      guid: newWidget.gridItem.label,
      settingsType: 'InfoSettings',
      title: `Инфо`,
      titleIcon: 'info',
    } as InfoSettings;
  }

  private createAllTrades(newWidget: NewWidget | Widget): AllTradesSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      ...toInstrumentKey(this.badges.yellow),
      linkToActive: true,
      badgeColor: defaultBadgeColor,
      guid: newWidget.gridItem.label,
      settingsType: 'AllTradesSettings',
      title: `Все сделки`,
      titleIcon: 'unordered-list',
      allTradesColumns: allTradesWidgetColumns.filter(c => c.isDefault).map(col => col.columnId)
    } as AllTradesSettings;
  }

  private createNews(newWidget: NewWidget | Widget): NewsSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      guid: newWidget.gridItem.label,
      settingsType: 'NewsSettings',
      title: 'Новости',
      titleIcon: 'read'
    } as NewsSettings;
  }

  private createExchangeRate(newWidget: NewWidget | Widget): ExchangeRateSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      guid: newWidget.gridItem.label,
      settingsType: 'ExchangeRateSettings',
      title: 'Курсы валют',
      titleIcon: 'line-chart'
    } as ExchangeRateSettings;
  }

  private createTechChart(newWidget: NewWidget | Widget): TechChartSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

    return {
      ...toInstrumentKey(this.badges.yellow),
      guid: newWidget.gridItem.label,
      settingsType: 'TechChartSettings',
      title: 'Тех. анализ',
      titleIcon: 'fund',
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
      titleIcon: 'profile',
      allInstrumentsColumns: allInstrumentsCols.filter(c => c.isDefault).map(col => col.columnId)
    } as AllInstrumentsSettings;
  }

  private createOrderSubmit(newWidget: NewWidget | Widget): OrderSubmitSettings {
    if (!newWidget.gridItem.label) {
      newWidget.gridItem.label = GuidGenerator.newGuid();
    }

      return {
      ...toInstrumentKey(this.badges.yellow),
      guid: newWidget.gridItem.label,
      badgeColor: defaultBadgeColor,
      settingsType: 'OrderSubmitSettings',
      title: 'Выставить заявку',
      titleIcon: 'send',
      linkToActive: true,
      enableLimitOrdersFastEditing: false,
      limitOrderPriceMoveSteps: [1, 2 , 5, 10],
      showVolumePanel: false,
      workingVolumes: [1, 5, 10, 20, 30, 40, 50, 100, 200]
    } as OrderSubmitSettings;
  }
}
