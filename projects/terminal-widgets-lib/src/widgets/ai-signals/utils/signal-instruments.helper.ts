import {SignalInstrument} from '../services/ai-signals-service.types';
import {AiSignalsViewModelHelper} from './ai-signals-view-model.helper';

export class SignalInstrumentsHelper {
  static availableTickers(instruments: readonly SignalInstrument[] | null | undefined): string[] {
    if (!Array.isArray(instruments)) {
      return [];
    }

    return [...new Set(instruments
      .filter(instrument => typeof instrument?.ticker === 'string'
        && typeof instrument.last_forecast_date === 'string'
        && instrument.last_forecast_date.trim().length > 0)
      .map(instrument => AiSignalsViewModelHelper.normalizeTicker(instrument.ticker))
      .filter(ticker => ticker.length > 0))]
      .sort((left, right) => left.localeCompare(right, 'en'));
  }
}
