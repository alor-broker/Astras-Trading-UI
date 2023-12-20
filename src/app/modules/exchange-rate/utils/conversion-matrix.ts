import { CurrencyPair } from "../../../shared/services/exchange-rate.service";
import { RateValue } from "../models/exchange-rate.model";

export interface RateProvider {
  getRate(firstCurrency: string, secondCurrency: string): RateValue | null;
}

export class ConversionMatrix {
  private readonly indexMap = new Map<string, { i: number, j: number }>();

  private constructor(
    private readonly index: string[],
    private readonly matrix: (RateProvider | null) [][],
  ) {
    for (let i = 0; i < index.length; i++) {
      for (let j = 0; j < index.length; j++) {
        this.indexMap.set(ConversionMatrix.getCurrencyKey(index[i], index[j]), { i, j });
      }
    }
  }

  static build(currencyPairs: CurrencyPair[], rateProvider: RateProvider): ConversionMatrix {
    const allCurrencies = Array.from(new Set([
        ...currencyPairs.map(item => item.firstCode),
        ...currencyPairs.map(item => item.secondCode)]
      )
    ).sort((a, b) => a.localeCompare(b));

    const pairs = new Map<string, string>(currencyPairs.map(p => [this.getCurrencyKey(p.firstCode, p.secondCode), p.symbolTom]));

    const matrix: (RateProvider | null) [][] = [];

    for (let i = 0; i < allCurrencies.length; i++) {
      const matrixRow: (RateProvider | null)[] = [];
      matrix.push(matrixRow);

      for (let j = 0; j < allCurrencies.length; j++) {
        const firstCurrency = allCurrencies[i];
        const secondCurrency = allCurrencies[j];

        if (firstCurrency !== secondCurrency) {
          const directPair = pairs.get(this.getCurrencyKey(firstCurrency, secondCurrency));
          if (directPair != null) {
            matrixRow.push(rateProvider);
            continue;
          }

          const reversedPair = pairs.get(this.getCurrencyKey(secondCurrency, firstCurrency));
          if (reversedPair != null) {
            const reversedRateProvider: RateProvider = {
              getRate: (first, second) => {
                const rate = rateProvider.getRate(second, first);
                if (rate != null && rate.rate > 0) {
                  return {
                    rate: 1 / rate.rate,
                    sourceSymbol: null
                  };
                }

                return rate;
              }
            };

            matrixRow.push(reversedRateProvider);
            continue;
          }
        }

        matrixRow.push(null);
      }
    }

    this.fillEmptyCells(matrix, allCurrencies);

    return new ConversionMatrix(allCurrencies, matrix);
  }

  private static fillEmptyCells(matrix: (RateProvider | null) [][], allCurrencies: string[]): void {
    // create clone to avoid using cross rate for other cross rates
    const initialMatrix: (RateProvider | null) [][] = [];
    for (let i = 0; i < allCurrencies.length; i++) {
      const matrixRow: (RateProvider | null)[] = [];
      initialMatrix.push(matrixRow);
      for (let j = 0; j < allCurrencies.length; j++) {
        matrixRow.push(matrix[i][j]);
      }
    }

    for (let i = 0; i < allCurrencies.length; i++) {
      for (let j = 0; j < allCurrencies.length; j++) {
        if (i === j) {
          continue;
        }

        if (matrix[i][j] != null) {
          continue;
        }

        const crossCurrencyIndexes = initialMatrix[i].map((value, index) => value != null ? index : null)
          .filter(x => x != null) as number[];

        const targetCrossCurrencyIndex = crossCurrencyIndexes.find(index => initialMatrix[j][index] != null) ?? null;

        if (targetCrossCurrencyIndex == null) {
          continue;
        }

        const firstRateProvider = initialMatrix[i][targetCrossCurrencyIndex]!;
        const secondRateProvider = initialMatrix[j][targetCrossCurrencyIndex]!;

        matrix[i][j] = {
          getRate(): RateValue | null {
            const firstCurrencyRate = firstRateProvider.getRate(allCurrencies[i], allCurrencies[targetCrossCurrencyIndex]);
            const secondCurrencyRate = secondRateProvider.getRate(allCurrencies[j], allCurrencies[targetCrossCurrencyIndex]);

            if (firstCurrencyRate && secondCurrencyRate && firstCurrencyRate.rate > 0 && secondCurrencyRate.rate > 0) {
              return {
                rate: firstCurrencyRate.rate / secondCurrencyRate.rate,
                sourceSymbol: null
              };
            }

            return null;
          }
        };
      }
    }
  }

  private static getCurrencyKey(fromCurrency: string, toCurrency: string): string {
    return `${fromCurrency}_${toCurrency}`;
  }

  getCurrencies(): string[] {
    return [...this.index];
  }

  getRate(firstCurrency: string, secondCurrency: string): RateValue | null {
    const index = this.indexMap.get(ConversionMatrix.getCurrencyKey(firstCurrency, secondCurrency));
    if (!index) {
      return null;
    }

    return this.matrix[index.i][index.j]?.getRate(firstCurrency, secondCurrency) ?? null;
  }
}
