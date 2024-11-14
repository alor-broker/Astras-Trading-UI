import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { SyntheticInstrumentsService } from './synthetic-instruments.service';
import { InstrumentsService } from "../../instruments/services/instruments.service";
import { HistoryService } from "../../../shared/services/history.service";
import { of, take } from "rxjs";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { Market } from "../../../../generated/graphql.types";
import { TestingHelpers } from "../../../shared/utils/testing/testing-helpers";

describe('SyntheticInstrumentsService', () => {
  let service: SyntheticInstrumentsService;

  const instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);
  const historyServiceSpy = jasmine.createSpyObj('HistoryService', ['getHistory']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: InstrumentsService,
          useValue: instrumentsServiceSpy
        },
        {
          provide: HistoryService,
          useValue: historyServiceSpy
        }
      ]
    });
    service = TestBed.inject(SyntheticInstrumentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getInstrument', () => {
    it('should return null observable if some of instruments response invalid', fakeAsync(() => {
      instrumentsServiceSpy.getInstrument.and.callFake((i: InstrumentKey) => i.symbol === 'SYM1' ? of(i) : of(null));

      service.getInstrument([
        {
          isSpreadOperator: false,
          value: {exchange: 'EXCH', symbol: 'SYM1'}
        },
        {
          isSpreadOperator: true,
          value: '+'
        },
        {
          isSpreadOperator: false,
          value: {exchange: 'EXCH', symbol: 'SYM2'}
        }
      ])
        .pipe(take(1))
        .subscribe(res => expect(res).toBeNull());

      tick();
    }));

    it('should correctly assemble synthetic instrument info', fakeAsync(() => {
      const instrumentKey1: InstrumentKey = {
        symbol: TestingHelpers.generateRandomString(5),
        exchange: TestingHelpers.generateRandomString(5),
        instrumentGroup: TestingHelpers.generateRandomString(5)
      };

      const instrument1: Instrument = {
        symbol: instrumentKey1.symbol,
        description: TestingHelpers.generateRandomString(10),
        exchange: instrumentKey1.exchange,
        instrumentGroup: instrumentKey1.instrumentGroup,
        currency: 'RUB',
        type: TestingHelpers.generateRandomString(5),
        shortName: TestingHelpers.generateRandomString(5),
        minstep: TestingHelpers.getRandomInt(1, 10),
        market: Market.Fond
      };

      const instrumentKey2: InstrumentKey = {
        symbol: TestingHelpers.generateRandomString(5),
        exchange: TestingHelpers.generateRandomString(5),
        instrumentGroup: TestingHelpers.generateRandomString(5)
      };

      const instrument2: Instrument = {
        symbol: instrumentKey2.symbol,
        description: TestingHelpers.generateRandomString(10),
        exchange: instrumentKey2.exchange,
        instrumentGroup: instrumentKey2.instrumentGroup,
        currency: 'RUB',
        type: TestingHelpers.generateRandomString(5),
        shortName: TestingHelpers.generateRandomString(5),
        minstep: TestingHelpers.getRandomInt(1, 10),
        market: Market.Fond
      };

      instrumentsServiceSpy.getInstrument.and.callFake((i: InstrumentKey) => of(i.symbol === instrumentKey1.symbol ? instrument1 : instrument2));

      service.getInstrument([
        {
          isSpreadOperator: true,
          value: '('
        },
        {
          isSpreadOperator: false,
          value: instrumentKey1
        },
        {
          isSpreadOperator: true,
          value: '+'
        },
        {
          isSpreadOperator: false,
          value: instrumentKey2
        },
        {
          isSpreadOperator: true,
          value: ')'
        },
      ])
        .pipe(take(1))
        .subscribe(instrument => {
          expect(instrument).toEqual({
            symbol: `([${instrumentKey1.exchange}:${instrumentKey1.symbol}:${instrumentKey1.instrumentGroup}]+[${instrumentKey2.exchange}:${instrumentKey2.symbol}:${instrumentKey2.instrumentGroup}])`,
            description: `(${instrumentKey1.symbol}+${instrumentKey2.symbol})`,
            exchange: `(${instrumentKey1.exchange}+${instrumentKey2.exchange})`,
            currency: 'RUB',
            type: `(${instrument1.type}+${instrument2.type})`,
            shortName: `([${instrumentKey1.exchange}:${instrumentKey1.symbol}:${instrumentKey1.instrumentGroup}]+[${instrumentKey2.exchange}:${instrumentKey2.symbol}:${instrumentKey2.instrumentGroup}])`,
            minstep: Math.min(instrument1.minstep, instrument2.minstep),
          });
        });

      tick();
    }));
  });

  describe('getHistory', () => {
    it('should return null observable if some of history responses is invalid', fakeAsync(() => {
      historyServiceSpy.getHistory.and.callFake((i: InstrumentKey) => i.symbol === 'SYM2' ? of({}) : of(null));

      service.getHistory({
        syntheticInstruments: [
          {
            isSpreadOperator: false,
            value: {exchange: 'EXCH', symbol: 'SYM1'}
          },
          {
            isSpreadOperator: true,
            value: '+'
          },
          {
            isSpreadOperator: false,
            value: {exchange: 'EXCH', symbol: 'SYM2'}
          }
        ],
        to: Date.now(),
        from: Date.now(),
        tf: '60',
        countBack: 100
      })
        .pipe(take(1))
        .subscribe(res => expect(res).toBeNull());

      tick();
    }));

    describe('Assemble history info', () => {
      it('should add missing candles', fakeAsync(() => {
        const candles1 = [
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 1,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 3,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 4,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
        ];

        const candles2 = [
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 2,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 4,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 5,
            volume: TestingHelpers.getRandomInt(1, 50),
          }
        ];

        historyServiceSpy.getHistory.and.callFake((i: InstrumentKey) => of({
          next: 1,
          prev: 1,
          history: i.symbol === 'SYM1' ? candles1 : candles2
        }));

        service.getHistory({
          syntheticInstruments: [
            {
              isSpreadOperator: false,
              value: { symbol: 'SYM1', exchange: 'EXCH'},
            },
            {
              isSpreadOperator: true,
              value: '-',
            },
            {
              isSpreadOperator: false,
              value: { symbol: 'SYM2', exchange: 'EXCH'},
            }
          ],
          from: Date.now(),
          to: Date.now(),
          tf: '60',
          countBack: 100
        })
          .pipe(take(1))
          .subscribe(h => {
            expect(h?.history).toEqual([
              {
                close: candles1[0].close - candles2[0].close,
                open: candles1[0].open - candles2[0].open,
                high: candles1[0].high - candles2[0].high,
                low: candles1[0].low - candles2[0].low,
                time: 2,
                volume: 0
              },
              {
                close: candles1[1].close - candles2[0].close,
                open: candles1[1].open - candles2[0].open,
                high: candles1[1].high - candles2[0].high,
                low: candles1[1].low - candles2[0].low,
                time: 3,
                volume: 0
              },
              {
                close: candles1[2].close - candles2[1].close,
                open: candles1[2].open - candles2[1].open,
                high: candles1[2].high - candles2[1].high,
                low: candles1[2].low - candles2[1].low,
                time: 4,
                volume: 0
              },
              {
                close: candles1[2].close - candles2[2].close,
                open: candles1[2].open - candles2[2].open,
                high: candles1[2].high - candles2[2].high,
                low: candles1[2].low - candles2[2].low,
                time: 5,
                volume: 0
              }
            ]);
          });

        tick();
      }));

      it('should correctly calculate candles sum', fakeAsync(() => {
        const candles1 = [
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 1,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
        ];

        const candles2 = [
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 1,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
        ];

        historyServiceSpy.getHistory.and.callFake((i: InstrumentKey) => of({
          next: 1,
          prev: 1,
          history: i.symbol === 'SYM1' ? candles1 : candles2
        }));

        service.getHistory({
          syntheticInstruments: [
            {
              isSpreadOperator: false,
              value: { symbol: 'SYM1', exchange: 'EXCH'},
            },
            {
              isSpreadOperator: true,
              value: '+',
            },
            {
              isSpreadOperator: false,
              value: { symbol: 'SYM2', exchange: 'EXCH'},
            }
          ],
          from: Date.now(),
          to: Date.now(),
          tf: '60',
          countBack: 100
        })
          .pipe(take(1))
          .subscribe(h => {
            expect(h?.history).toEqual([
              {
                close: candles1[0].close + candles2[0].close,
                open: candles1[0].open + candles2[0].open,
                high: candles1[0].high + candles2[0].high,
                low: candles1[0].low + candles2[0].low,
                time: 1,
                volume: 0
              },
            ]);
          });

        tick();
      }));

      it('should correctly calculate candles division', fakeAsync(() => {
        const candles1 = [
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 1,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
        ];

        const candles2 = [
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 1,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
        ];

        historyServiceSpy.getHistory.and.callFake((i: InstrumentKey) => of({
          next: 1,
          prev: 1,
          history: i.symbol === 'SYM1' ? candles1 : candles2
        }));

        service.getHistory({
          syntheticInstruments: [
            {
              isSpreadOperator: false,
              value: { symbol: 'SYM1', exchange: 'EXCH'},
            },
            {
              isSpreadOperator: true,
              value: '/',
            },
            {
              isSpreadOperator: false,
              value: { symbol: 'SYM2', exchange: 'EXCH'},
            }
          ],
          from: Date.now(),
          to: Date.now(),
          tf: '60',
          countBack: 100
        })
          .pipe(take(1))
          .subscribe(h => {
            expect(h?.history).toEqual([
              {
                close: candles1[0].close / candles2[0].close,
                open: candles1[0].open / candles2[0].open,
                high: candles1[0].high / candles2[0].high,
                low: candles1[0].low / candles2[0].low,
                time: 1,
                volume: 0
              },
            ]);
          });

        tick();
      }));

      it('should correctly calculate candles multiplication', fakeAsync(() => {
        const candles1 = [
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 1,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
        ];

        const candles2 = [
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 1,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
        ];

        historyServiceSpy.getHistory.and.callFake((i: InstrumentKey) => of({
          next: 1,
          prev: 1,
          history: i.symbol === 'SYM1' ? candles1 : candles2
        }));

        service.getHistory({
          syntheticInstruments: [
            {
              isSpreadOperator: false,
              value: { symbol: 'SYM1', exchange: 'EXCH'},
            },
            {
              isSpreadOperator: true,
              value: '*',
            },
            {
              isSpreadOperator: false,
              value: { symbol: 'SYM2', exchange: 'EXCH'},
            }
          ],
          from: Date.now(),
          to: Date.now(),
          tf: '60',
          countBack: 100
        })
          .pipe(take(1))
          .subscribe(h => {
            expect(h?.history).toEqual([
              {
                close: candles1[0].close * candles2[0].close,
                open: candles1[0].open * candles2[0].open,
                high: candles1[0].high * candles2[0].high,
                low: candles1[0].low * candles2[0].low,
                time: 1,
                volume: 0
              },
            ]);
          });

        tick();
      }));

      it('should correctly calculate candle and number calculations', fakeAsync(() => {
        const candles1 = [
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 1,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
        ];

        historyServiceSpy.getHistory.and.returnValue(of({
          next: 1,
          prev: 1,
          history: candles1
        }));

        service.getHistory({
          syntheticInstruments: [
            {
              isSpreadOperator: false,
              value: { symbol: 'SYM1', exchange: 'EXCH'},
            },
            {
              isSpreadOperator: true,
              value: '+',
            },
            {
              isSpreadOperator: true,
              value: '2',
            },
          ],
          from: Date.now(),
          to: Date.now(),
          tf: '60',
          countBack: 100
        })
          .pipe(take(1))
          .subscribe(h => {
            expect(h?.history).toEqual([
              {
                close: candles1[0].close + 2,
                open: candles1[0].open + 2,
                high: candles1[0].high + 2,
                low: candles1[0].low + 2,
                time: 1,
                volume: 0
              },
            ]);
          });

        tick();
      }));

      it('should correctly calculate brackets expressions', fakeAsync(() => {
        const candles1 = [
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 1,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
        ];

        const candles2 = [
          {
            close: TestingHelpers.getRandomInt(1, 50),
            open: TestingHelpers.getRandomInt(1, 50),
            high: TestingHelpers.getRandomInt(1, 50),
            low: TestingHelpers.getRandomInt(1, 50),
            time: 1,
            volume: TestingHelpers.getRandomInt(1, 50),
          },
        ];

        historyServiceSpy.getHistory.and.callFake((i: InstrumentKey) => of({
          next: 1,
          prev: 1,
          history: i.symbol === 'SYM1' ? candles1 : candles2
        }));

        service.getHistory({
          syntheticInstruments: [
            {
              isSpreadOperator: true,
              value: '(',
            },
            {
              isSpreadOperator: false,
              value: { symbol: 'SYM1', exchange: 'EXCH'},
            },
            {
              isSpreadOperator: true,
              value: '+',
            },
            {
              isSpreadOperator: false,
              value: { symbol: 'SYM2', exchange: 'EXCH'},
            },
            {
              isSpreadOperator: true,
              value: ')',
            },
            {
              isSpreadOperator: true,
              value: '*',
            },
            {
              isSpreadOperator: true,
              value: '2',
            },
          ],
          from: Date.now(),
          to: Date.now(),
          tf: '60',
          countBack: 100
        })
          .pipe(take(1))
          .subscribe(h => {
            expect(h?.history).toEqual([
              {
                close: (candles1[0].close + candles2[0].close) * 2,
                open: (candles1[0].open + candles2[0].open) * 2,
                high: (candles1[0].high + candles2[0].high) * 2,
                low: (candles1[0].low + candles2[0].low) * 2,
                time: 1,
                volume: 0
              },
            ]);
          });

        tick();
      }));
    });
  });
});
