import {AiSignalsViewModelHelper} from './ai-signals-view-model.helper';
import {
  SignalAction,
  SignalBatchResult,
  SignalDirection,
  SignalForecast
} from '../services/ai-signals-service.types';
import {SignalRowStatus} from '../types/ai-signals-view.types';

function createSignal(overrides?: Partial<SignalForecast>): SignalForecast {
  return {
    ticker: 'SBER',
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

    it('should derive the exchange from full_ticker with a MOEX fallback', () => {
      const response = createResponse([
        createSignal({ticker: 'SBER', full_ticker: 'SBER:SPBX'}),
        createSignal({ticker: 'GAZP', full_ticker: null})
      ]);

      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER', 'GAZP', 'LKOH'], response);

      expect(rows[0].exchange).toBe('SPBX');
      expect(rows[1].exchange).toBe('MOEX');
      expect(rows[2].exchange).toBe('MOEX');
    });

    it('should preserve the requested tickers order and match case-insensitively', () => {
      const response = createResponse([
        createSignal({ticker: 'GAZP'}),
        createSignal({ticker: 'SBER'})
      ]);

      const rows = AiSignalsViewModelHelper.toRowViewModels(['sber', ' gazp '], response);

      expect(rows.map(row => row.ticker)).toEqual(['SBER', 'GAZP']);
      expect(rows.every(row => row.status === SignalRowStatus.Ok)).toBe(true);
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

    it('should keep known checklist keys translatable and mark unknown ones', () => {
      const signal = createSignal({
        consensus: {
          direction: SignalDirection.Bullish,
          action: SignalAction.BuyPullback,
          confidence: 5,
          trade_plan: {entry_price: 1, stop_loss: 0.5, take_profit_1: 2, take_profit_2: 3, risk_reward_ratio: 2},
          short_checklist: {
            F1_daily_bearish_regime: true,
            F5_unknown_filter: false
          }
        }
      });
      const rows = AiSignalsViewModelHelper.toRowViewModels(['SBER'], createResponse([signal]));

      const details = AiSignalsViewModelHelper.toDetailsViewModel(rows[0]);

      expect(details!.checklist).toEqual([
        {key: 'F1_daily_bearish_regime', labelKey: 'F1_daily_bearish_regime', passed: true},
        {key: 'F5_unknown_filter', labelKey: null, passed: false}
      ]);
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
