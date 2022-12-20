import { TestBed } from '@angular/core/testing';
import { WidgetFactoryService } from './widget-factory.service';
import { OrderbookSettings } from "../models/settings/orderbook-settings.model";
import { WidgetNames } from "../models/enums/widget-names";
import { ScalperOrderBookSettings } from "../models/settings/scalper-order-book-settings.model";
import { defaultInstrument } from "../../store/instruments/instruments.reducer";
import { LightChartSettings } from "../models/settings/light-chart-settings.model";
import { TimeframesHelper } from "../../modules/light-chart/utils/timeframes-helper";
import { allInstrumentsColumns, InstrumentSelectSettings } from "../models/settings/instrument-select-settings.model";
import {
  allOrdersColumns,
  allPositionsColumns,
  allStopOrdersColumns,
  allTradesColumns,
  BlotterSettings
} from "../models/settings/blotter-settings.model";
import { InfoSettings } from "../models/settings/info-settings.model";
import { AllTradesSettings } from "../models/settings/all-trades-settings.model";
import { NewsSettings } from "../models/settings/news-settings.model";
import { ExchangeRateSettings } from "../models/settings/exchange-rate-settings.model";
import { sharedModuleImportForTests } from "../utils/testing";
import { Store } from "@ngrx/store";
import { selectNewPortfolio } from "../../store/portfolios/portfolios.actions";
import { TechChartSettings } from "../models/settings/tech-chart-settings.model";
import { OrderSubmitSettings } from "../models/settings/order-submit-settings.model";
import { TimeframeValue } from '../../modules/light-chart/models/light-chart.models';
import { OrdersBasketSettings } from '../models/settings/orders-basket-settings.model';
import { TableSettingHelper } from '../utils/table-setting.helper';

describe('WidgetFactoryService', () => {
  let service: WidgetFactoryService;
  let store: Store;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers: [WidgetFactoryService]
    });

    service = TestBed.inject(WidgetFactoryService);
    store = TestBed.inject(Store);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create new order book settings', () => {
    const orderBookSettings: OrderbookSettings = service.createNewSettings({
      guid: '213',
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.orderBook, label: 'testGuid'}
    }) as OrderbookSettings;

    expect(orderBookSettings.settingsType).toBe('OrderbookSettings');
    expect(orderBookSettings.symbol).toBe(defaultInstrument.symbol);
    expect(orderBookSettings.exchange).toBe(defaultInstrument.exchange);
    expect(orderBookSettings.instrumentGroup).toBe(defaultInstrument.instrumentGroup);
    expect(orderBookSettings.isin).toBe(defaultInstrument.isin);
    expect(orderBookSettings.guid).toBe('testGuid');
  });

  it('should create new scalper order book settings', () => {
    const scaleperOrderBookSettings: ScalperOrderBookSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.scalperOrderBook, label: 'testGuid'}
    }) as ScalperOrderBookSettings;

    expect(scaleperOrderBookSettings.settingsType).toBe('ScalperOrderBookSettings');
    expect(scaleperOrderBookSettings.symbol).toBe(defaultInstrument.symbol);
    expect(scaleperOrderBookSettings.exchange).toBe(defaultInstrument.exchange);
    expect(scaleperOrderBookSettings.instrumentGroup).toBe(defaultInstrument.instrumentGroup);
    expect(scaleperOrderBookSettings.isin).toBe(defaultInstrument.isin);
    expect(scaleperOrderBookSettings.guid).toBe('testGuid');
  });

  it('should create new chart settings', () => {
    const chartSettings: LightChartSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.lightChart, label: 'testGuid'}
    }) as LightChartSettings;

    expect(chartSettings.settingsType).toBe('LightChartSettings');
    expect(chartSettings.symbol).toBe(defaultInstrument.symbol);
    expect(chartSettings.exchange).toBe(defaultInstrument.exchange);
    expect(chartSettings.instrumentGroup).toBe(defaultInstrument.instrumentGroup);
    expect(chartSettings.isin).toBe(defaultInstrument.isin);
    expect(chartSettings.timeFrame).toBe(TimeframesHelper.getTimeframeByValue(TimeframeValue.Day)?.value);
    expect(chartSettings.guid).toBe('testGuid');
  });

  it('should create new instrument select settings', () => {
    const instrumentSelectSettings: InstrumentSelectSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.instrumentSelect, label: 'testGuid'}
    }) as InstrumentSelectSettings;

    expect(instrumentSelectSettings.settingsType).toBe('InstrumentSelectSettings');
    expect(instrumentSelectSettings.instrumentColumns).toEqual(allInstrumentsColumns.filter(c => c.isDefault).map(c => c.columnId));
    expect(instrumentSelectSettings.guid).toBe('testGuid');
  });

  it('should create new blotter settings',() => {
    store.dispatch(selectNewPortfolio({portfolio: {
        portfolio: 'test portfolio',
        exchange: 'MOEX',
      }}));

    const blotterSettings: BlotterSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.blotter, label: 'testGuid'}
    }) as BlotterSettings;

    expect(blotterSettings.settingsType).toBe('BlotterSettings');
    expect(blotterSettings.activeTabIndex).toBe(0);
    expect(blotterSettings.portfolio).toBe('test portfolio');
    expect(blotterSettings.exchange).toBe(defaultInstrument.exchange);
    expect(blotterSettings.tradesTable).toEqual(TableSettingHelper.toTableDisplaySettings(allTradesColumns.filter(c => c.isDefault).map(c => c.columnId)));
    expect(blotterSettings.positionsTable).toEqual(TableSettingHelper.toTableDisplaySettings(allPositionsColumns.filter(c => c.isDefault).map(c => c.columnId)));
    expect(blotterSettings.ordersTable).toEqual(TableSettingHelper.toTableDisplaySettings(allOrdersColumns.filter(c => c.isDefault).map(c => c.columnId)));
    expect(blotterSettings.stopOrdersTable).toEqual(TableSettingHelper.toTableDisplaySettings(allStopOrdersColumns.filter(c => c.isDefault).map(c => c.columnId)));
    expect(blotterSettings.guid).toBe('testGuid');
  });

  it('should create new instrument info settings', () => {
    const instrumentInfoSettings: InfoSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.instrumentInfo, label: 'testGuid'}
    }) as InfoSettings;

    expect(instrumentInfoSettings.settingsType).toBe('InfoSettings');
    expect(instrumentInfoSettings.symbol).toBe(defaultInstrument.symbol);
    expect(instrumentInfoSettings.exchange).toBe(defaultInstrument.exchange);
    expect(instrumentInfoSettings.instrumentGroup).toBe(defaultInstrument.instrumentGroup);
    expect(instrumentInfoSettings.isin).toBe(defaultInstrument.isin);
    expect(instrumentInfoSettings.guid).toBe('testGuid');
  });

  it('should create new all trades settings', () => {
    const allTradesSettings: AllTradesSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.allTrades, label: 'testGuid'}
    }) as AllTradesSettings;

    expect(allTradesSettings.settingsType).toBe('AllTradesSettings');
    expect(allTradesSettings.symbol).toBe(defaultInstrument.symbol);
    expect(allTradesSettings.exchange).toBe(defaultInstrument.exchange);
    expect(allTradesSettings.instrumentGroup).toBe(defaultInstrument.instrumentGroup);
    expect(allTradesSettings.isin).toBe(defaultInstrument.isin);
    expect(allTradesSettings.guid).toBe('testGuid');
  });

  it('should create new news settings', () => {
    const newsSettings: NewsSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.news, label: 'testGuid'}
    }) as NewsSettings;

    expect(newsSettings.settingsType).toBe('NewsSettings');
    expect(newsSettings.guid).toBe('testGuid');
  });

  it('should create new exchange rate settings', () => {
    const exchangeRateSettings: ExchangeRateSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.exchangeRate, label: 'testGuid'}
    }) as ExchangeRateSettings;

    expect(exchangeRateSettings.settingsType).toBe('ExchangeRateSettings');
    expect(exchangeRateSettings.guid).toBe('testGuid');
  });

  it('should create new tech chart settings', () => {
    const settings: TechChartSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.techChart, label: 'testGuid'}
    }) as TechChartSettings;

    expect(settings.settingsType).toBe('TechChartSettings');
    expect(settings.guid).toBe('testGuid');
  });

  it('should create new order submit settings', () => {
    const settings: OrderSubmitSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.orderSubmit, label: 'testGuid'}
    }) as OrderSubmitSettings;

    expect(settings.settingsType).toBe('OrderSubmitSettings');
    expect(settings.guid).toBe('testGuid');
  });

  it('should create new orders basket settings', () => {
    const settings: OrdersBasketSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.ordersBasket, label: 'testGuid'}
    }) as OrdersBasketSettings;

    expect(settings.settingsType).toBe('OrdersBasketSettings');
    expect(settings.guid).toBe('testGuid');
  });

  it('should create new settings with additional settings', () => {
    const orderBookSettings: OrderbookSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.orderBook}
    },
      {
        guid: 'testGuid',
      }) as OrderbookSettings;

    expect(orderBookSettings.guid).toBe('testGuid');
  });
});
