import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';

import { TechChartDatafeedService } from './tech-chart-datafeed.service';
import { InstrumentsService } from "../../instruments/services/instruments.service";
import { HistoryService } from "../../../shared/services/history.service";
import {
  HttpClientTestingModule,
  HttpTestingController
} from "@angular/common/http/testing";
import { environment } from "../../../../environments/environment";
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
  of
} from "rxjs";
import { HistoryResponse } from "../../../shared/models/history/history-response.model";
import { Candle } from "../../../shared/models/history/candle.model";
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import { TranslatorService } from "../../../shared/services/translator.service";

describe('TechChartDatafeedService', () => {
  let service: TechChartDatafeedService;

  let subscriptionsDataFeedServiceSpy: any;
  let instrumentsServiceSpy: any;
  let historyServiceSpy: any;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    subscriptionsDataFeedServiceSpy = jasmine.createSpyObj('SubscriptionsDataFeedService', ['subscribe']);
    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument', 'getInstruments']);
    historyServiceSpy = jasmine.createSpyObj('HistoryService', ['getHistory']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        TechChartDatafeedService,
        { provide: SubscriptionsDataFeedService, useValue: subscriptionsDataFeedServiceSpy },
        { provide: InstrumentsService, useValue: instrumentsServiceSpy },
        { provide: HistoryService, useValue: historyServiceSpy },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(of(() => 'Московская Биржа'))
          }
        }
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
      const expectedConfig: DatafeedConfiguration = {
        supports_time: true,
        supported_resolutions: [
          '1' as ResolutionString,
          '5' as ResolutionString,
          '15' as ResolutionString,
          '30' as ResolutionString,
          '1H' as ResolutionString,
          '4h' as ResolutionString,
          '1D' as ResolutionString,
          '1W' as ResolutionString,
          '2W' as ResolutionString,
          '1M' as ResolutionString,
          '3M' as ResolutionString
        ],
        exchanges: [
          {
            value: 'MOEX',
            name: 'Московская Биржа',
            desc: 'Московская Биржа'
          },
          {
            value: 'SPBX',
            name: 'SPBX',
            desc: 'SPBX'
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

    const request = httpTestingController.expectOne(`${environment.apiUrl}//md/v2/time`);
    expect(request.request.method).toEqual('GET');
    request.flush(expectedTime);
  });

  it('#resolveSymbol should pass value to onResolve callback', (done) => {
    const instrumentDetails = {
      symbol: 'SBER',
      exchange: 'MOEX',
      instrumentGroup: 'TQBR',
      description: 'description',
      currency: 'RUB',
      minstep: 0.01,
      type: 'type'
    } as Instrument;

    const expectedSymbol = {
      name: instrumentDetails.symbol,
      full_name: instrumentDetails.symbol,
      ticker: `${instrumentDetails.exchange}:${instrumentDetails.symbol}:${instrumentDetails.instrumentGroup}`,
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
      timezone: 'Europe/Moscow',
      session: '24x7',
      supported_resolutions: [
        '1' as ResolutionString,
        '5' as ResolutionString,
        '15' as ResolutionString,
        '30' as ResolutionString,
        '1H' as ResolutionString,
        '4h' as ResolutionString,
        '1D' as ResolutionString,
        '1W' as ResolutionString,
        '2W' as ResolutionString,
        '1M' as ResolutionString,
        '3M' as ResolutionString
      ]
    } as LibrarySymbolInfo;

    instrumentsServiceSpy.getInstrument.and.returnValue(of(instrumentDetails));

    service.resolveSymbol(
      expectedSymbol.ticker!,
      symbolInfo => {
        done();
        expect(symbolInfo).toEqual(expectedSymbol);
      },
      () => {
        done();
        throw new Error();
      }
    );
  });

  it('#resolveSymbol should pass error to onError callback', (done) => {
    const wrongSymbols = [
      '',
      'SBER',
      'SBER:'
    ];

    wrongSymbols.forEach(wrongSymbol => {
      service.resolveSymbol(
        wrongSymbol,
        () => {
          throw new Error();
        },
        reason => {
          expect(reason).toBe('Unknown symbol');
        }
      );
    });

    instrumentsServiceSpy.getInstrument.and.returnValue(of(null));

    service.resolveSymbol(
      'SBER:MOEX',
      () => {
        throw new Error();
      },
      reason => {
        done();
        expect(reason).toBe('Unknown symbol');
      }
    );
  });

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
        ticker: `${instrumentDetails.exchange}:${instrumentDetails.symbol}`,
        description: instrumentDetails.description,
        full_name: instrumentDetails.symbol,
        type: ''
      }
    ];

    instrumentsServiceSpy.getInstruments.and.returnValue(of([instrumentDetails]));

    service.searchSymbols('test', 'MOEX', '', items => {
      done();

      expect(items).toEqual(expectedResult);
    });
  });

  it('#getBars should pass value to onResult callback', (done) => {
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
        done();

        expect(bars).toEqual(historyResponse.history.map(x => ({
          ...x,
          time: x.time * 1000
        })));
      },
      () => {
        throw new Error();
      }
    );
  });

  it('#getBars should pass error to onError callback', (done) => {
    historyServiceSpy.getHistory.and.returnValue(of(null));

    service.getBars(
      { ticker: 'MOEX:SBER' } as LibrarySymbolInfo,
      '1' as ResolutionString,
      { from: 0 } as PeriodParams,
      () => {
        throw new Error();
      },
      reason => {
        done();
        expect(reason).toBe('Unable to load history');
      }
    );
  });

  it('#subscribeBars should pass value to onTick callback', (done) => {
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
      { ticker: 'MOEX:SBER:TQBR' } as LibrarySymbolInfo,
      '1' as ResolutionString,
      bar => {
        done();

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
  });
});

