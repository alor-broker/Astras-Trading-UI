import {
  SignalInstrument,
  SignalInstrumentKey
} from '../services/ai-signals-service.types';
import {AiSignalsViewModelHelper} from './ai-signals-view-model.helper';

export type SignalInstrumentOption = SignalInstrumentKey;

export class SignalInstrumentsHelper {
  static availableInstruments(instruments: readonly SignalInstrument[] | null | undefined): SignalInstrumentOption[] {
    if (instruments == null) {
      return [];
    }

    const uniqueInstruments = new Map<string, SignalInstrumentOption>();

    for (const instrument of instruments) {
      const ticker = typeof instrument.ticker === 'string'
        ? AiSignalsViewModelHelper.normalizeTicker(instrument.ticker)
        : '';
      const exchange = typeof instrument.exchange === 'string'
        ? instrument.exchange.trim().toUpperCase()
        : '';

      if (ticker.length === 0
        || exchange.length === 0
        || typeof instrument.last_forecast_date !== 'string'
        || instrument.last_forecast_date.trim().length === 0) {
        continue;
      }

      uniqueInstruments.set(this.toKey({ticker, exchange}), {ticker, exchange});
    }

    return [...uniqueInstruments.values()]
      .sort((left, right) => left.ticker.localeCompare(right.ticker, 'en')
        || left.exchange.localeCompare(right.exchange, 'en'));
  }

  static resolveAvailableInstruments(
    selectedInstruments: readonly SignalInstrumentKey[],
    availableInstruments: readonly SignalInstrumentOption[]
  ): SignalInstrumentOption[] {
    const instrumentsByKey = new Map(
      availableInstruments.map(instrument => [this.toKey(instrument), instrument] as const)
    );
    const resolved = selectedInstruments.map(instrument => instrumentsByKey.get(this.toKey(instrument)) ?? null)
      .filter((instrument): instrument is SignalInstrumentOption => instrument != null);

    return [...new Map(resolved.map(instrument => [this.toKey(instrument), instrument])).values()];
  }

  static toKey(instrument: SignalInstrumentKey): string {
    return `${instrument.exchange.trim().toUpperCase()}:${AiSignalsViewModelHelper.normalizeTicker(instrument.ticker)}`;
  }
}
