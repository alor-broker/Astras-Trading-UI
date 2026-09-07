import {TestBed} from '@angular/core/testing';
import {map, of, takeUntil, timer} from 'rxjs';
import {TestScheduler} from 'rxjs/testing';
import {QuotesServiceMockFactory, QuotesServiceMockResult} from '@testing-lib/angular/quotes-service.mock';
import {SignalDetailsService} from './signal-details.service';
import {SignalAction, SignalAnalysisStatus} from './ai-signals-service.types';
import {AiSignalsViewModelHelper} from '../utils/ai-signals-view-model.helper';
import {SignalDetailsViewModel, SignalRowViewModel} from '../types/ai-signals-view.types';

describe('SignalDetailsService', () => {
  let service: SignalDetailsService;
  let quotes: QuotesServiceMockResult;
  let scheduler: TestScheduler;
  let row: SignalRowViewModel;

  beforeEach(() => {
    quotes = QuotesServiceMockFactory.create(101);
    TestBed.configureTestingModule({providers: [SignalDetailsService, quotes.provider]});
    service = TestBed.inject(SignalDetailsService);
    scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
    row = AiSignalsViewModelHelper.toRowViewModels([{ticker: 'SBER', exchange: 'MOEX'}], {
      signals: [{
        ticker: 'SBER',
        exchange: 'MOEX',
        current_price: 100,
        consensus: {action: SignalAction.BuyPullback, trade_plan: {entry_price: 100, take_profit_1: 110}},
        analysts: [{trade_plan: {entry_price: 99, take_profit_1: 109}}],
        fundamental: {available: true, latest: {Revenue: {value_mln: 10}}},
        technical_analysis: {tf_86400: {basic_data: {price: 100}}}
      }]
    })[0];
  });

  it('should fetch immediately and every minute and update all trade plans without changing the source', () => {
    const received: {time: number, details: SignalDetailsViewModel | null}[] = [];
    quotes.service.getLastPrice.mockReturnValueOnce(of(101)).mockReturnValueOnce(of(102));

    scheduler.run(() => {
      service.getDetails(of(row)).pipe(takeUntil(timer(60_001))).subscribe(details => {
        received.push({time: scheduler.now(), details});
      });
    });

    expect(received.map(item => [item.time, item.details?.currentPrice])).toEqual([[0, 100], [0, 101], [60_000, 102]]);
    expect(received[2].details?.analysts[0].currentPrice).toBe(102);
    expect(received[2].details?.expectedProfitPercent).toBe(row.expectedProfitPercent);
    expect(row.currentPrice).toBe(100);
    expect(row.raw?.current_price).toBe(100);
    expect(quotes.service.getLastPrice).toHaveBeenCalledTimes(2);
    expect(quotes.service.getLastPrice).toHaveBeenCalledWith(expect.objectContaining({symbol: 'SBER', exchange: 'MOEX'}));
  });

  it('should preserve analysis references when only the current price changes', () => {
    const received: (SignalDetailsViewModel | null)[] = [];

    scheduler.run(() => {
      service.getDetails(of(row)).pipe(takeUntil(timer(1))).subscribe(details => received.push(details));
    });

    expect(received).toHaveLength(2);
    const [initial, updated] = received;
    expect(updated).not.toBe(initial);
    expect(updated?.currentPrice).toBe(101);
    expect(updated?.fundamental).toBe(initial?.fundamental);
    expect(updated?.technicalAnalysis).toBe(initial?.technicalAnalysis);
    expect(updated?.tradePlan).toBe(initial?.tradePlan);
    expect(updated?.avoidReasons).toBe(initial?.avoidReasons);
    expect(updated?.analysts[0].tradePlan).toBe(initial?.analysts[0].tradePlan);
    expect(updated?.analysts[0].avoidReasons).toBe(initial?.analysts[0].avoidReasons);
    expect(initial?.analysts[0].currentPrice).toBe(100);
  });

  it('should retain the fallback or last valid price on missing and invalid quotes and recover later', () => {
    const prices: (number | null | undefined)[] = [];
    for (const price of [null, 101, 0, -1, NaN, Infinity, null, 102]) {
      quotes.service.getLastPrice.mockReturnValueOnce(of(price));
    }

    scheduler.run(() => {
      service.getDetails(of(row)).pipe(takeUntil(timer(420_001))).subscribe(details => prices.push(details?.currentPrice));
    });

    expect(prices).toEqual([100, 101, 102]);
    expect(quotes.service.getLastPrice).toHaveBeenCalledTimes(8);
  });

  it('should cancel an in-flight quote when changing signals and stop polling when closed', () => {
    const nextRow = {...row, ticker: 'GAZP', currentPrice: 200};

    scheduler.run(({hot, cold, expectObservable, expectSubscriptions}) => {
      const oldQuote$ = cold('50ms (p|)', {p: 101});
      const nextQuote$ = cold('5ms (p|)', {p: 201});
      quotes.service.getLastPrice.mockReturnValueOnce(oldQuote$).mockReturnValueOnce(nextQuote$);
      const rows$ = hot<SignalRowViewModel | null>('a 9ms b 9ms c|', {a: row, b: nextRow, c: null});
      const result$ = service.getDetails(rows$).pipe(map(details => details == null ? null : [details.ticker, details.currentPrice]));

      expectObservable(result$).toBe('a 9ms b 4ms p 4ms c|', {a: ['SBER', 100], b: ['GAZP', 200], p: ['GAZP', 201], c: null});
      expectSubscriptions(oldQuote$.subscriptions).toBe('^ 9ms !');
      expectSubscriptions(nextQuote$.subscriptions).toBe('10ms ^ 4ms !');
    });

    expect(quotes.service.getLastPrice).toHaveBeenCalledTimes(2);
  });

  it('should cancel pending requests when the consumer is destroyed', () => {
    scheduler.run(({cold, expectObservable, expectSubscriptions}) => {
      const quote$ = cold('2m (p|)', {p: 101});
      quotes.service.getLastPrice.mockReturnValue(quote$);

      expectObservable(service.getDetails(of(row)).pipe(map(details => details?.currentPrice)), '10ms !').toBe('p', {p: 100});
      expectSubscriptions(quote$.subscriptions).toBe('^ 9ms !');
    });

    expect(quotes.service.getLastPrice).toHaveBeenCalledTimes(1);
  });

  it('should not overlap slow quote requests', () => {
    scheduler.run(({cold, expectObservable}) => {
      quotes.service.getLastPrice.mockReturnValue(cold('90s (p|)', {p: 101}));

      expectObservable(service.getDetails(of(row)).pipe(map(details => details?.currentPrice)), '119s !')
        .toBe('a 89999ms b', {a: 100, b: 101});
    });

    expect(quotes.service.getLastPrice).toHaveBeenCalledTimes(1);
  });

  it('should not request a quote for a closed dialog or a skipped signal', () => {
    const skippedRow = AiSignalsViewModelHelper.toRowViewModels([{ticker: 'YNDX', exchange: 'MOEX'}], {
      signals: [{ticker: 'YNDX', status: SignalAnalysisStatus.NotAnalyzed}]
    })[0];

    scheduler.run(({expectObservable}) => {
      expectObservable(service.getDetails(of(null, skippedRow))).toBe('(aa|)', {a: null});
    });

    expect(quotes.service.getLastPrice).not.toHaveBeenCalled();
  });

  it('should retain analysis without requesting quotes when the API did not provide an exchange', () => {
    scheduler.run(({expectObservable}) => {
      expectObservable(service.getDetails(of({...row, exchange: null})).pipe(map(details => details?.currentPrice)))
        .toBe('(p|)', {p: row.currentPrice});
    });

    expect(quotes.service.getLastPrice).not.toHaveBeenCalled();
  });

  it('should request quotes using the exchange supplied by the API', () => {
    scheduler.run(({expectObservable}) => {
      expectObservable(service.getDetails(of({...row, exchange: 'ITS'})).pipe(map(details => details?.currentPrice)), '1ms !')
        .toBe('(ab)', {a: row.currentPrice, b: 101});
    });

    expect(quotes.service.getLastPrice).toHaveBeenCalledWith(expect.objectContaining({symbol: 'SBER', exchange: 'ITS'}));
  });
});
