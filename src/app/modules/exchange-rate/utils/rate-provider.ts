import { RateProvider } from "./conversion-matrix";
import {
  Rate,
  RateValue
} from "../models/exchange-rate.model";

export class DefaultRateProvider implements RateProvider {
  private readonly rates = new Map<string, Rate>();

  getRate(firstCurrency: string, secondCurrency: string): RateValue | null {
    const rate = this.rates.get(this.getCurrencyKey(firstCurrency, secondCurrency));

    if (!rate) {
      return null;
    }

    return {
      rate: rate.lastPrice,
      sourceSymbol: rate.symbolTom
    };
  }

  updateRates(rates: Rate[]): void {
    this.rates.clear();
    rates.forEach(x => {
      this.rates.set(this.getCurrencyKey(x.fromCurrency, x.toCurrency), x);
    });
  }

  private getCurrencyKey(fromCurrency: string, toCurrency: string): string {
    return `${fromCurrency}_${toCurrency}`;
  }
}
