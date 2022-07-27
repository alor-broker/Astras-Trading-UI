import { TestBed } from '@angular/core/testing';
import { WidgetFactoryService } from './widget-factory.service';
import { Store } from "@ngrx/store";
import { of } from "rxjs";
import { OrderbookSettings } from "../models/settings/orderbook-settings.model";
import { WidgetNames } from "../models/enums/widget-names";
import { ScalperOrderBookSettings } from "../models/settings/scalper-order-book-settings.model";
import { defaultInstrument } from "../../store/instruments/instruments.reducer";
import { LightChartSettings } from "../models/settings/light-chart-settings.model";
import { TimeframesHelper, TimeframeValue } from "../../modules/light-chart/utils/timeframes-helper";
import { allInstrumentsColumns, InstrumentSelectSettings } from "../models/settings/instrument-select-settings.model";
import {
  allOrdersColumns,
  allPositionsColumns,
  allStopOrdersColumns,
  allTradesColumns,
  BlotterSettings
} from "../models/settings/blotter-settings.model";
import { CurrencyInstrument } from "../models/enums/currencies.model";
import { InfoSettings } from "../models/settings/info-settings.model";
import { AllTradesSettings } from "../models/settings/all-trades-settings.model";
import { NewsSettings } from "../models/settings/news-settings.model";
import { ExchangeRateSettings } from "../models/settings/exchange-rate-settings.model";

describe('WidgetFactoryService', () => {
  let service: WidgetFactoryService;

  const storeSpy = {
    select: jasmine.createSpy('select').and.returnValue(of({...defaultInstrument, portfolio: 'test portfolio'}))
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WidgetFactoryService,
        {
          provide: Store,
          useValue: storeSpy
        }
      ]
    });

    service = TestBed.inject(WidgetFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create new order book settings', () => {
    const orderBookSettings: OrderbookSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.orderBook}
    }) as OrderbookSettings;

    expect(orderBookSettings.settingsType).toBe('OrderbookSettings');
    expect(orderBookSettings.symbol).toBe(defaultInstrument.symbol);
    expect(orderBookSettings.exchange).toBe(defaultInstrument.exchange);
    expect(orderBookSettings.instrumentGroup).toBe(defaultInstrument.instrumentGroup);
    expect(orderBookSettings.isin).toBe(defaultInstrument.isin);
  });

  it('should create new scalper order book settings', () => {
    const scaleperOrderBookSettings: ScalperOrderBookSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.scalperOrderBook}
    }) as ScalperOrderBookSettings;

    expect(scaleperOrderBookSettings.settingsType).toBe('ScalperOrderBookSettings');
    expect(scaleperOrderBookSettings.symbol).toBe(defaultInstrument.symbol);
    expect(scaleperOrderBookSettings.exchange).toBe(defaultInstrument.exchange);
    expect(scaleperOrderBookSettings.instrumentGroup).toBe(defaultInstrument.instrumentGroup);
    expect(scaleperOrderBookSettings.isin).toBe(defaultInstrument.isin);
  });

  it('should create new chart settings', () => {
    const chartSettings: LightChartSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.lightChart}
    }) as LightChartSettings;

    expect(chartSettings.settingsType).toBe('LightChartSettings');
    expect(chartSettings.symbol).toBe(defaultInstrument.symbol);
    expect(chartSettings.exchange).toBe(defaultInstrument.exchange);
    expect(chartSettings.instrumentGroup).toBe(defaultInstrument.instrumentGroup);
    expect(chartSettings.isin).toBe(defaultInstrument.isin);
    expect(chartSettings.timeFrame).toBe(TimeframesHelper.getTimeframeByValue(TimeframeValue.Day)?.value);
  });

  it('should create new instrument select settings', () => {
    const instrumentSelectSettings: InstrumentSelectSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.instrumentSelect}
    }) as InstrumentSelectSettings;

    expect(instrumentSelectSettings.settingsType).toBe('InstrumentSelectSettings');
    expect(instrumentSelectSettings.instrumentColumns).toEqual(allInstrumentsColumns.filter(c => c.isDefault).map(c => c.columnId));
  });

  it('should create new blotter settings', () => {
    const blotterSettings: BlotterSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.blotter}
    }) as BlotterSettings;

    expect(blotterSettings.settingsType).toBe('BlotterSettings');
    expect(blotterSettings.activeTabIndex).toBe(0);
    expect(blotterSettings.currency).toBe(CurrencyInstrument.USD);
    expect(blotterSettings.portfolio).toBe('test portfolio');
    expect(blotterSettings.exchange).toBe(defaultInstrument.exchange);
    expect(blotterSettings.tradesColumns).toEqual(allTradesColumns.filter(c => c.isDefault).map(c => c.columnId));
    expect(blotterSettings.positionsColumns).toEqual(allPositionsColumns.filter(c => c.isDefault).map(c => c.columnId));
    expect(blotterSettings.ordersColumns).toEqual(allOrdersColumns.filter(c => c.isDefault).map(c => c.columnId));
    expect(blotterSettings.stopOrdersColumns).toEqual(allStopOrdersColumns.filter(c => c.isDefault).map(c => c.columnId));
  });

  it('should create new instrument info settings', () => {
    const instrumentInfoSettings: InfoSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.instrumentInfo}
    }) as InfoSettings;

    expect(instrumentInfoSettings.settingsType).toBe('InfoSettings');
    expect(instrumentInfoSettings.symbol).toBe(defaultInstrument.symbol);
    expect(instrumentInfoSettings.exchange).toBe(defaultInstrument.exchange);
    expect(instrumentInfoSettings.instrumentGroup).toBe(defaultInstrument.instrumentGroup);
    expect(instrumentInfoSettings.isin).toBe(defaultInstrument.isin);
  });

  it('should create new all trades settings', () => {
    const allTradesSettings: AllTradesSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.allTrades}
    }) as AllTradesSettings;

    expect(allTradesSettings.settingsType).toBe('AllTradesSettings');
    expect(allTradesSettings.symbol).toBe(defaultInstrument.symbol);
    expect(allTradesSettings.exchange).toBe(defaultInstrument.exchange);
    expect(allTradesSettings.instrumentGroup).toBe(defaultInstrument.instrumentGroup);
    expect(allTradesSettings.isin).toBe(defaultInstrument.isin);
  });

  it('should create new news settings', () => {
    const newsSettings: NewsSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.news}
    }) as NewsSettings;

    expect(newsSettings.settingsType).toBe('NewsSettings');
  });

  it('should create new exchange rate settings', () => {
    const exchangeRateSettings: ExchangeRateSettings = service.createNewSettings({
      gridItem: {x: 0, y: 0, rows: 1, cols: 1, type: WidgetNames.exchangeRate}
    }) as ExchangeRateSettings;

    expect(exchangeRateSettings.settingsType).toBe('ExchangeRateSettings');
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
