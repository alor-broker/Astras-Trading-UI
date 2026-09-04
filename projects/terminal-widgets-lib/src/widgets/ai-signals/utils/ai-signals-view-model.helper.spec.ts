import {AiSignalsViewModelHelper} from './ai-signals-view-model.helper';
import {
  SignalAction,
  SignalAnalysisStatus,
  RiskLevel,
  SignalBatchResult,
  SignalDirection,
  SignalForecast
} from '../services/ai-signals-service.types';
import {SignalRowStatus} from '../types/ai-signals-view.types';

function createSignal(overrides?: Partial<SignalForecast>): SignalForecast {
  return {
    ticker: 'SBER',
    exchange: 'MOEX',
    full_ticker: 'SBER:MOEX',
    request_datetime: '2026-07-01T12:00:00',
    forecast_date: '2026-07-01',
    current_price: 101.5,
    consensus: {
      direction: SignalDirection.Bullish,
      action: SignalAction.BuyPullback,
      confidence: 8,
      expected_holding_days: 5,
      trade_plan: {
        entry_price: 99,
        stop_loss: 94,
        take_profit_1: 110,
        take_profit_2: 115,
        risk_reward_ratio: 2.2
      },
      reasoning: 'reasoning text'
    },
    errors: [],
    warnings: [],
    ...overrides
  };
}

function createResponse(signals: SignalForecast[]): SignalBatchResult {
  return {
    schema_version: 'signal-1',
    generated_at: '2026-07-01T15:30:00',
    signals
  };
}

describe('AiSignalsViewModelHelper', () => {
  describe('toRowViewModels', () => {
    it('should deduplicate saved tickers and normalize ticker names in the response', () => {
      const tickers = [' sber ', 'SBER', '', 'gazp'];
      const rows = AiSignalsViewModelHelper.toRowViewModels(tickers, createResponse([
        createSignal({ticker: ' sber '}), createSignal({ticker: 'GAZP'})
      ]));

      expect(rows.map(row => row.ticker)).toEqual(['SBER', 'GAZP']);
      expect(rows.every(row => row.status === SignalRowStatus.Ok)).toBe(true);
      expect(tickers).toEqual([' sber ', 'SBER', '', 'gazp']);
    });

    it('should handle a signal-2 not_analyzed placeholder without treating it as an error', () => {
      const placeholder: SignalForecast = {
        ticker: 'YNDX',
        status: SignalAnalysisStatus.NotAnalyzed,
        status_note: '  инструмент не анализировался — данных в системе нет  ',
        exchange: 'MOEX',
        broker_symbol: 'MOEX:YNDX',
        full_ticker: 'YNDX:MOEX',
        errors: [],
        warnings: []
      };
      const response: SignalBatchResult = {
        schema_version: 'signal-2',
        signals: [placeholder, createSignal({status: SignalAnalysisStatus.Ok})],
        meta: {n_requests: 2, n_not_analyzed: 1, n_not_ready: 0}
      };

      const rows = AiSignalsViewModelHelper.toRowViewModels(['YNDX', 'SBER'], response);
      const skipped = rows[1];

      expect(rows.map(row => row.ticker)).toEqual(['SBER', 'YNDX']);
      expect(skipped).toMatchObject({
        status: SignalRowStatus.NotAnalyzed,
        statusNote: 'инструмент не анализировался — данных в системе нет',
        direction: null, action: null, confidence: null,
        expectedProfitPercent: null, expectedHoldingDays: null, forecastDateDisplay: null
      });
      expect(skipped.raw).toBe(placeholder);
      expect(AiSignalsViewModelHelper.canOpenDetails(skipped)).toBe(false);
      expect(AiSignalsViewModelHelper.toDetailsViewModel(skipped)).toBeNull();
    });

    it('should not expose stale consensus values when status explicitly says not_analyzed', () => {
      const signal = createSignal({status: SignalAnalysisStatus.NotAnalyzed});

      const [row] = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      expect(row.status).toBe(SignalRowStatus.NotAnalyzed);
      expect(row.confidence).toBeNull();
      expect(row.direction).toBeNull();
      expect(row.action).toBeNull();
      expect(row.expectedProfitPercent).toBeNull();
      expect(row.expectedHoldingDays).toBeNull();
    });

    it('should not treat status ok as success when consensus is absent', () => {
      const signal = createSignal({status: SignalAnalysisStatus.Ok, consensus: null});

      const [row] = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      expect(row.status).toBe(SignalRowStatus.Error);
      expect(AiSignalsViewModelHelper.canOpenDetails(row)).toBe(true);
    });

    it('should preserve degraded analysis when status ok includes warnings', () => {
      const signal = createSignal({status: SignalAnalysisStatus.Ok, warnings: ['partial analysis']});

      const [row] = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      expect(row.status).toBe(SignalRowStatus.Degraded);
      expect(row.confidence).toBe(8);
      expect(AiSignalsViewModelHelper.toDetailsViewModel(row)?.warnings).toEqual(['partial analysis']);
    });

    it('should fall back to consensus diagnostics for an unknown server status', () => {
      const signal = createSignal({status: 'future_status' as SignalAnalysisStatus});

      const [row] = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      expect(row.status).toBe(SignalRowStatus.Ok);
      expect(AiSignalsViewModelHelper.canOpenDetails(row)).toBe(true);
    });

    it('should use explicit exchange and normalize an empty status note', () => {
      const signal = createSignal({exchange: ' spbx ', status_note: '  '});

      const [row] = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      expect(row.exchange).toBe('SPBX');
      expect(row.statusNote).toBeNull();
    });

    it('should map a signal with consensus to an Ok row', () => {
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([createSignal()]));

      expect(rows).toHaveLength(1);
      expect(rows[0].status).toBe(SignalRowStatus.Ok);
      expect(rows[0].ticker).toBe('SBER');
      expect(rows[0].exchange).toBe('MOEX');
      expect(rows[0].direction).toBe(SignalDirection.Bullish);
      expect(rows[0].action).toBe(SignalAction.BuyPullback);
      expect(rows[0].confidence).toBe(8);
      expect(rows[0].currentPrice).toBe(101.5);
      expect(rows[0].expectedProfitPercent).toBeCloseTo(11.11, 2);
      expect(rows[0].expectedHoldingDays).toBe(5);
      expect(rows[0].forecastDateDisplay).toBe('01.07.2026');
      expect(rows[0].raw).not.toBeNull();
    });

    it('should mark a requested ticker missing from the response as NoData', () => {
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER', 'GAZP'], createResponse([createSignal()]));

      expect(rows).toHaveLength(2);
      expect(rows[1].ticker).toBe('GAZP');
      expect(rows[1].status).toBe(SignalRowStatus.NoData);
      expect(rows[1].raw).toBeNull();
    });

    it('should mark a signal without consensus as Error', () => {
      const signal = createSignal({
        consensus: null,
        errors: ['market_data collection failed']
      });

      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      expect(rows[0].status).toBe(SignalRowStatus.Error);
      expect(rows[0].raw).not.toBeNull();
    });

    it('should mark a signal with warnings as Degraded', () => {
      const signal = createSignal({warnings: ['news_service unavailable']});

      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      expect(rows[0].status).toBe(SignalRowStatus.Degraded);
    });

    it('should mark a signal with consensus and non-empty errors as Degraded', () => {
      const signal = createSignal({errors: ['fundamental collection failed']});

      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      expect(rows[0].status).toBe(SignalRowStatus.Degraded);
    });

    it('should leave missing exchanges unknown instead of guessing from full_ticker or defaulting to MOEX', () => {
      const response = createResponse([
        createSignal({ticker: 'SBER', exchange: undefined, full_ticker: 'SBER:SPBX'}),
        createSignal({ticker: 'GAZP', exchange: ' ', full_ticker: null})
      ]);

      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER', 'GAZP', 'LKOH'], response);

      expect(rows[0].exchange).toBeNull();
      expect(rows[1].exchange).toBeNull();
      expect(rows[2].exchange).toBeNull();
    });

    it('should preserve the requested order for equal confidence and match case-insensitively', () => {
      const response = createResponse([
        createSignal({ticker: 'GAZP'}),
        createSignal({ticker: 'SBER'})
      ]);

      const rows = AiSignalsViewModelHelper.toRowViewModels(['sber', ' gazp '], response);

      expect(rows.map(row => row.ticker)).toEqual(['SBER', 'GAZP']);
      expect(rows.every(row => row.status === SignalRowStatus.Ok)).toBe(true);
    });

    it('should sort by descending confidence without changing the watchlist or response order', () => {
      const tickers = ['LOW', 'HIGH', 'MEDIUM'];
      const signals = [
        createSignal({ticker: 'LOW', consensus: {confidence: 2}}),
        createSignal({ticker: 'HIGH', consensus: {confidence: 10}}),
        createSignal({ticker: 'MEDIUM', consensus: {confidence: 6}})
      ];

      const rows = AiSignalsViewModelHelper.toRowViewModels(tickers, createResponse(signals));

      expect(rows.map(row => row.ticker)).toEqual(['HIGH', 'MEDIUM', 'LOW']);
      expect(tickers).toEqual(['LOW', 'HIGH', 'MEDIUM']);
      expect(signals.map(signal => signal.ticker)).toEqual(['LOW', 'HIGH', 'MEDIUM']);
    });

    it('should place missing and invalid confidence after zero while preserving their order', () => {
      const signals = [
        createSignal({ticker: 'UNKNOWN', consensus: {}}),
        createSignal({ticker: 'INVALID', consensus: {confidence: 11}}),
        createSignal({ticker: 'ERROR', consensus: null}),
        createSignal({ticker: 'ZERO', consensus: {confidence: 0}})
      ];

      const rows = AiSignalsViewModelHelper.toRowViewModels(
        ['UNKNOWN', 'INVALID', 'ERROR', 'MISSING', 'ZERO'], createResponse(signals)
      );

      expect(rows.map(row => row.ticker)).toEqual(['ZERO', 'UNKNOWN', 'INVALID', 'ERROR', 'MISSING']);
      expect(rows.slice(1).every(row => row.confidence == null)).toBe(true);
    });

    it('should expose the same short-side profit and holding period in the list and details', () => {
      const signal = createSignal({consensus: {
        action: SignalAction.SellRally,
        expected_holding_days: 3,
        trade_plan: {entry_price: 100, take_profit_1: 90}
      }});

      const [row] = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));
      const details = AiSignalsViewModelHelper.toDetailsViewModel(row);

      expect(row.expectedProfitPercent).toBe(10);
      expect(row.expectedHoldingDays).toBe(3);
      expect(details?.expectedProfitPercent).toBe(row.expectedProfitPercent);
      expect(details?.expectedHoldingDays).toBe(row.expectedHoldingDays);
    });

    it('should not invent profit or holding days when the API omits them', () => {
      const [row] = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([
        createSignal({consensus: {action: SignalAction.BuyPullback}})
      ]));

      expect(row.expectedProfitPercent).toBeNull();
      expect(row.expectedHoldingDays).toBeNull();
    });

    it('should mark all tickers as NoData for a response without signals', () => {
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER', 'GAZP'], {});

      expect(rows).toHaveLength(2);
      expect(rows.every(row => row.status === SignalRowStatus.NoData)).toBe(true);
    });

    it('should treat unknown enum values from the server as null without throwing', () => {
      const signal = createSignal({
        consensus: {
          direction: 'SIDEWAYS' as SignalDirection,
          action: 'HOLD' as SignalAction,
          confidence: 5
        }
      });

      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      expect(rows[0].status).toBe(SignalRowStatus.Ok);
      expect(rows[0].direction).toBeNull();
      expect(rows[0].action).toBeNull();
    });
  });

  describe('toDetailsViewModel', () => {
    it('should return null for a NoData row', () => {
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([]));

      expect(AiSignalsViewModelHelper.toDetailsViewModel(rows[0])).toBeNull();
    });

    it('should map consensus details including the trade plan', () => {
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([createSignal()]));

      const details = AiSignalsViewModelHelper.toDetailsViewModel(rows[0]);

      expect(details).not.toBeNull();
      expect(details!.tradePlan).toEqual({
        entryPrice: 99,
        stopLoss: 94,
        takeProfit1: 110,
        takeProfit2: 115,
        riskRewardRatio: 2.2
      });
      expect(details!.reasoning).toBe('reasoning text');
      expect(details!.expectedHoldingDays).toBe(5);
      expect(details!.expectedProfitPercent).toBeCloseTo(11.11, 2);
    });

    it('should evaluate each analyst plan using its own action without changing consensus levels', () => {
      const signal = createSignal({
        consensus: {
          action: SignalAction.BuyPullback,
          trade_plan: {entry_price: 100, take_profit_1: 90}
        },
        analysts: [{
          model_name: 'private-model',
          direction: SignalDirection.Bearish,
          action: SignalAction.SellRally,
          confidence: 0,
          expected_holding_days: 3,
          trade_plan: {entry_price: 100, stop_loss: 110, take_profit_1: 90, take_profit_2: 80},
          risk_notes: {news_risk: RiskLevel.Low, gap_risk: RiskLevel.High, avoid_reasons: ['risk']},
          reasoning: 'Analyst reasoning'
        }]
      });
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      const details = AiSignalsViewModelHelper.toDetailsViewModel(rows[0]);

      expect(details!.expectedProfitPercent).toBeNull();
      expect(details!.tradePlan?.takeProfit1).toBe(90);
      expect(details!.analysts[0]).toMatchObject({
        index: 1, confidence: 0, expectedHoldingDays: 3, expectedProfitPercent: 10,
        newsRisk: RiskLevel.Low, gapRisk: RiskLevel.High, avoidReasons: ['risk'], reasoning: 'Analyst reasoning'
      });
      expect(details!.analysts[0]).not.toHaveProperty('model_name');
    });

    it('should not expose a trade plan for a NO_TRADE signal', () => {
      const signal = createSignal({
        consensus: {
          direction: SignalDirection.Neutral,
          action: SignalAction.NoTrade,
          confidence: 0,
          trade_plan: null
        }
      });
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      const details = AiSignalsViewModelHelper.toDetailsViewModel(rows[0]);

      expect(details!.tradePlan).toBeNull();
    });

    it('should pass errors and warnings of the signal through', () => {
      const signal = createSignal({
        consensus: null,
        errors: ['market_data collection failed'],
        warnings: ['news_service unavailable']
      });
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      const details = AiSignalsViewModelHelper.toDetailsViewModel(rows[0]);

      expect(details!.errors).toEqual(['market_data collection failed']);
      expect(details!.warnings).toEqual(['news_service unavailable']);
    });

    it('should hide optional blocks that are absent in the signal', () => {
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([createSignal()]));

      const details = AiSignalsViewModelHelper.toDetailsViewModel(rows[0]);

      expect(details!.analysts).toEqual([]);
      expect(details!.newsSummary).toBeNull();
      expect(details!.fundamental).toBeNull();
      expect(details!.technicalAnalysis).toBeNull();
    });

    it('should discard invalid numeric values without hiding the remaining trade plan', () => {
      const signal = createSignal({
        current_price: 0,
        consensus: {
          direction: SignalDirection.Bullish,
          action: SignalAction.BuyPullback,
          confidence: 11,
          expected_holding_days: -2,
          trade_plan: {
            entry_price: -1,
            stop_loss: Number.NaN,
            take_profit_1: 110,
            take_profit_2: 0,
            risk_reward_ratio: Number.POSITIVE_INFINITY
          }
        }
      });
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      const details = AiSignalsViewModelHelper.toDetailsViewModel(rows[0]);

      expect(details!.confidence).toBeNull();
      expect(details!.currentPrice).toBeNull();
      expect(details!.expectedHoldingDays).toBeNull();
      expect(details!.expectedProfitPercent).toBeNull();
      expect(details!.tradePlan).toEqual({
        entryPrice: null,
        stopLoss: null,
        takeProfit1: 110,
        takeProfit2: null,
        riskRewardRatio: null
      });
    });

    it('should hide a trade plan when it has no valid values', () => {
      const signal = createSignal({
        consensus: {
          direction: SignalDirection.Bullish,
          action: SignalAction.BuyPullback,
          trade_plan: {
            entry_price: 0,
            stop_loss: -1,
            take_profit_1: Number.NaN
          }
        }
      });
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      const details = AiSignalsViewModelHelper.toDetailsViewModel(rows[0]);

      expect(details!.tradePlan).toBeNull();
      expect(details!.expectedProfitPercent).toBeNull();
    });

    it('should hide the fundamental block when the server reports it as unavailable', () => {
      const signal = createSignal({fundamental: {available: false}});
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      const details = AiSignalsViewModelHelper.toDetailsViewModel(rows[0]);

      expect(details!.fundamental).toBeNull();
    });

    it('should humanize known timeframe keys of the technical analysis block', () => {
      const signal = createSignal({
        technical_analysis: {
          tf_3600: {rsi: 45.2},
          tf_86400: {rsi: 52},
          custom_block: {value: 1}
        }
      });
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      const details = AiSignalsViewModelHelper.toDetailsViewModel(rows[0]);

      expect(Object.keys(details!.technicalAnalysis!)).toEqual(['1H', '1D', 'custom_block']);
    });
  });

  describe('formatForecastDate', () => {
    it('should format a contract date without timezone shifts', () => {
      expect(AiSignalsViewModelHelper.formatForecastDate('2026-07-01')).toBe('01.07.2026');
    });

    it('should pass through unexpected formats and handle empty input', () => {
      expect(AiSignalsViewModelHelper.formatForecastDate('2026/07/01')).toBe('2026/07/01');
      expect(AiSignalsViewModelHelper.formatForecastDate(null)).toBeNull();
      expect(AiSignalsViewModelHelper.formatForecastDate('')).toBeNull();
    });
  });
});
