import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';

import { TechChartDatafeedService } from './tech-chart-datafeed.service';
import { InstrumentsService } from "../../instruments/services/instruments.service";
import { HistoryService } from "../../../shared/services/history.service";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import {
  DatafeedConfiguration,
  LibrarySymbolInfo,
  PeriodParams,
  ResolutionString,
  SearchSymbolResultItem
} from "../../../../assets/charting_library";
import { Instrument } from "../../../shared/models/instruments/instrument.model";
import {
  BehaviorSubject,
  of, Subject
} from "rxjs";
import { HistoryResponse } from "../../../shared/models/history/history-response.model";
import { Candle } from "../../../shared/models/history/candle.model";
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import { TranslatorService } from "../../../shared/services/translator.service";
import { SyntheticInstrumentsService } from "./synthetic-instruments.service";
import { BarsRequest } from "../../light-chart/models/bars-request.model";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { ExchangeSettings } from "../../../shared/models/market-settings.model";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TestingHelpers } from "../../../shared/utils/testing/testing-helpers";

describe('TechChartDatafeedService', () => {
  let service: TechChartDatafeedService;

  let subscriptionsDataFeedServiceSpy: any;
  let instrumentsServiceSpy: any;
  let syntheticInstrumentsServiceSpy: any;
  let historyServiceSpy: any;
  let httpTestingController: HttpTestingController;
  const apiUrl = 'apiUrl';

  beforeEach(() => {
    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument', 'getInstruments']);
    syntheticInstrumentsServiceSpy = jasmine.createSpyObj('SyntheticInstrumentsService', ['getInstrument', 'getHistory']);
    historyServiceSpy = jasmine.createSpyObj('HistoryService', ['getHistory']);
    subscriptionsDataFeedServiceSpy = jasmine.createSpyObj('SubscriptionsDataFeedService', ['subscribe']);
    subscriptionsDataFeedServiceSpy.subscribe.and.returnValue(new Subject());
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        TechChartDatafeedService,
        {
            provide: SubscriptionsDataFeedService,
            useValue: subscriptionsDataFeedServiceSpy
        },
        { provide: InstrumentsService, useValue: instrumentsServiceSpy },
        { provide: HistoryService, useValue: historyServiceSpy },
        {
            provide: TranslatorService,
            useValue: {
                getTranslator: jasmine.createSpy('getTranslator').and.returnValue(of(() => 'Московская Биржа'))
            }
        },
        {
            provide: SyntheticInstrumentsService,
            useValue: syntheticInstrumentsServiceSpy
        },
        {
            provide: EnvironmentService,
            useValue: {
                apiUrl
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});

    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(TechChartDatafeedService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#onReady should provide config', fakeAsync(() => {
    service.setExchangeSettings([
      {
        exchange: "MOEX",
        settings: {} as ExchangeSettings
      }
    ]);

      const expectedConfig: DatafeedConfiguration = {
        supports_time: true,
        supported_resolutions: [
          '1S' as ResolutionString,
          '5S' as ResolutionString,
          '10S' as ResolutionString,
          '15S' as ResolutionString,
          '30S' as ResolutionString,
          '45S' as ResolutionString,
          '1' as ResolutionString,
          '2' as ResolutionString,
          '3' as ResolutionString,
          '5' as ResolutionString,
          '10' as ResolutionString,
          '15' as ResolutionString,
          '30' as ResolutionString,
          '45' as ResolutionString,
          '1H' as ResolutionString,
          '2H' as ResolutionString,
          '3H' as ResolutionString,
          '4h' as ResolutionString,
          '1D' as ResolutionString,
          '1W' as ResolutionString,
          '2W' as ResolutionString,
          '1M' as ResolutionString,
          '3M' as ResolutionString,
          '6M' as ResolutionString,
          '12M' as ResolutionString
        ],
        exchanges: [
          {
            value: 'MOEX',
            name: 'Московская Биржа',
            desc: 'Московская Биржа'
          }
        ]
      };

      service.onReady(configuration => {
        expect(configuration).toEqual(expectedConfig);
      });

      tick();
    })
  );

  it('#getServerTime should request time', () => {
    const expectedTime = Date.now();
    service.getServerTime(serverTime => {
      expect(serverTime).toBe(expectedTime);
    });

    const request = httpTestingController.expectOne(`${apiUrl}/md/v2/time`);
    expect(request.request.method).toEqual('GET');
    request.flush(expectedTime);
  });

  it('#resolveSymbol should pass value to onResolve callback', fakeAsync(() => {
    service.setExchangeSettings([
      {
        exchange: "MOEX",
        settings: {
          timezone: 'Europe/Moscow',
          defaultTradingSession: '24x7'
        } as ExchangeSettings
      }
    ]);

    const instrumentDetails = {
      symbol: 'SBER',
      exchange: 'MOEX',
      instrumentGroup: 'TQBR',
      description: 'description',
      currency: 'RUB',
      minstep: 0.01,
      type: 'type',
      shortName: 'SBER'
    } as Instrument;

    const expectedSymbol = {
      name: instrumentDetails.shortName,
      ticker: `[${instrumentDetails.exchange}:${instrumentDetails.symbol}:${instrumentDetails.instrumentGroup}]`,
      exchange: instrumentDetails.exchange,
      listed_exchange: instrumentDetails.exchange,
      description: instrumentDetails.description,
      currency_code: instrumentDetails.currency,
      type: instrumentDetails.type,
      minmov: 1,
      pricescale: 100,
      format: 'price',
      has_empty_bars: false,
      has_intraday: true,
      has_seconds: true,
      has_weekly_and_monthly: true,
      weekly_multipliers: ['1','2'],
      monthly_multipliers: ['1','3','6','12'],
      timezone: 'Europe/Moscow',
      session: '24x7',
    } as LibrarySymbolInfo;

    instrumentsServiceSpy.getInstrument.and.returnValue(of(instrumentDetails));

    service.resolveSymbol(
      expectedSymbol.ticker!,
      symbolInfo => {
        expect(symbolInfo).toEqual(expectedSymbol);
      },
      () => {
        throw new Error();
      }
    );

    tick();
  }));

  it('#resolveSymbol should pass error to onError callback', fakeAsync(() => {
    instrumentsServiceSpy.getInstrument.and.returnValue(of(null));

    service.resolveSymbol(
      'SBER:MOEX',
      () => {
        throw new Error();
      },
      reason => {
        expect(reason).toBe('Unknown symbol');
      }
    );

    tick();
  }));

  it('#searchSymbols should pass value to onResult callback', (done) => {
    const instrumentDetails = {
      symbol: 'SBER',
      exchange: 'MOEX',
      instrumentGroup: 'TQBR',
      description: 'description',
      currency: 'RUB',
      minstep: 0.01,
      type: 'type'
    } as Instrument;

    const expectedResult: SearchSymbolResultItem[] = [
      {
        symbol: instrumentDetails.symbol,
        exchange: instrumentDetails.exchange,
        ticker: `[${instrumentDetails.exchange}:${instrumentDetails.symbol}]`,
        description: instrumentDetails.description,
        type: ''
      }
    ];

    instrumentsServiceSpy.getInstruments.and.returnValue(of([instrumentDetails]));

    service.searchSymbols('test', 'MOEX', '', items => {
      done();

      expect(items).toEqual(expectedResult);
    });
  });

  it('#getBars should pass value to onResult callback', fakeAsync(() => {
    const historyResponse: HistoryResponse = {
      history: [
        {
          time: Date.now() / 1000,
          open: 100,
          close: 120,
          low: 95,
          high: 105,
          volume: 1000
        }
      ],
      prev: 0,
      next: 0
    };

    historyServiceSpy.getHistory.and.returnValue(of(historyResponse));

    service.getBars(
      { ticker: 'MOEX:SBER' } as LibrarySymbolInfo,
      '1' as ResolutionString,
      { firstDataRequest: true, from: 0 } as PeriodParams,
      (bars) => {
        expect(bars).toEqual(historyResponse.history.map(x => ({
          ...x,
          time: x.time * 1000
        })));
      },
      () => {
        throw new Error();
      }
    );

    tick();
  }));

  it('#getBars should pass error to onError callback', fakeAsync(() => {
    historyServiceSpy.getHistory.and.returnValue(of(null));

    service.getBars(
      { ticker: 'MOEX:SBER' } as LibrarySymbolInfo,
      '1' as ResolutionString,
      { from: 0 } as PeriodParams,
      () => {
        throw new Error();
      },
      reason => {
        expect(reason).toBe('Unable to load history');
      }
    );

    tick();
  }));

  it('#subscribeBars should pass value to onTick callback', fakeAsync(() => {
    const symbolInfo = { ticker: 'MOEX:SBER:TQBR' } as LibrarySymbolInfo;
    const resolution = '1' as ResolutionString;
    const historyResponse: HistoryResponse = {
      history: [
        {
          time: Date.now() / 1000,
          open: 100,
          close: 120,
          low: 95,
          high: 105,
          volume: 1000
        }
      ],
      prev: 0,
      next: 0
    };

    syntheticInstrumentsServiceSpy.getHistory.and.returnValue(of(historyResponse));
    historyServiceSpy.getHistory.and.returnValue(of(historyResponse));

    service.getBars(
      symbolInfo,
      resolution,
      { firstDataRequest: true, from: 0 } as PeriodParams,
      () => {
      },
      () => {
      }
    );

    const expectedBar = {
      time: Date.now() / 1000,
      open: 100,
      close: 120,
      low: 95,
      high: 105,
      volume: 1000
    };

    const messages$ = new BehaviorSubject<Candle | null>(expectedBar);

    subscriptionsDataFeedServiceSpy.subscribe.and.returnValue(messages$);

    service.subscribeBars(
      symbolInfo,
      resolution,
      bar => {
        expect(subscriptionsDataFeedServiceSpy.subscribe).toHaveBeenCalledWith(jasmine.objectContaining({
            opcode: 'BarsGetAndSubscribe',
            code: 'SBER',
            exchange: 'MOEX',
            instrumentGroup: 'TQBR',
            format: 'simple',
            tf: '60',
          }),
          jasmine.anything());

        expect(bar).toEqual({
          ...expectedBar,
          time: expectedBar.time * 1000
        });
      },
      'guid'
    );

    tick();
  }));

  it('#subscribeBars should correctly assemble bar info', fakeAsync(() => {
    const symbolInfo = { ticker: 'MOEX:SBER:TQBR-MOEX:SBERP:TQBR' } as LibrarySymbolInfo;
    const resolution = '1' as ResolutionString;
    const historyResponse: HistoryResponse = {
      history: [
        {
          time: Math.round(Date.now() / 1000),
          open: TestingHelpers.getRandomInt(100, 150),
          close: TestingHelpers.getRandomInt(100, 150),
          low: TestingHelpers.getRandomInt(100, 150),
          high: TestingHelpers.getRandomInt(100, 150),
          volume: TestingHelpers.getRandomInt(500, 1000)
        }
      ],
      prev: 0,
      next: 0
    };

    const sberNewBar = {
      time: Math.round(Date.now() / 1000),
      open: TestingHelpers.getRandomInt(100, 150),
      close: TestingHelpers.getRandomInt(100, 150),
      low: TestingHelpers.getRandomInt(100, 150),
      high: TestingHelpers.getRandomInt(100, 150),
      volume: TestingHelpers.getRandomInt(500, 1000)
    };

    const sberpNewBar = {
      time: Math.round(Date.now() / 1000),
      open: TestingHelpers.getRandomInt(100, 150),
      close: TestingHelpers.getRandomInt(100, 150),
      low: TestingHelpers.getRandomInt(100, 150),
      high: TestingHelpers.getRandomInt(100, 150),
      volume: TestingHelpers.getRandomInt(500, 1000)
    };

    syntheticInstrumentsServiceSpy.getHistory.and.returnValue(of(historyResponse));
    historyServiceSpy.getHistory.and.callFake(() => {
      return of(historyResponse);
    });

    service.getBars(
      symbolInfo,
      resolution,
      { firstDataRequest: true, from: 0 } as PeriodParams,
      () => {},
      () => {}
    );

    const expectedBar = {
      time: Math.round(Date.now() / 1000),
      open: sberNewBar.open - sberpNewBar.open,
      close: sberNewBar.close - sberpNewBar.close,
      low: sberNewBar.low - sberpNewBar.low,
      high: sberNewBar.high - sberpNewBar.high,
      volume: 0
    };

    subscriptionsDataFeedServiceSpy.subscribe.and.callFake((r: BarsRequest) => {
      return new BehaviorSubject(r.code === 'SBER' ? sberNewBar : sberpNewBar);
    });

    const onTickSpy = jasmine.createSpy('onTickSpy');

    service.subscribeBars(
      symbolInfo,
      resolution,
      onTickSpy,
      'guid'
    );

    expect(subscriptionsDataFeedServiceSpy.subscribe).toHaveBeenCalledWith(jasmine.objectContaining({
        opcode: 'BarsGetAndSubscribe',
        code: 'SBER',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        format: 'simple',
        tf: '60',
      }) as any,
      jasmine.anything() as any);

    expect(subscriptionsDataFeedServiceSpy.subscribe).toHaveBeenCalledWith(jasmine.objectContaining({
        opcode: 'BarsGetAndSubscribe',
        code: 'SBERP',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        format: 'simple',
        tf: '60',
      }) as any,
      jasmine.anything() as any);

    tick();

    expect(onTickSpy).toHaveBeenCalledWith({
      ...expectedBar,
      time: expectedBar.time * 1000
    } as any);
  }));
});
