export enum FuturesGluingType {
  L = 'L',
  S = 'S',
  AL = 'AL',
  AS = 'AS',
}

export class FuturesInstrumentHelper {
  private static readonly isFuturesGluingRegex = /!(L|S|AL|AS)$/i;

  static isFuturesGluing(symbol: string): boolean {
    return this.isFuturesGluingRegex.test(symbol);
  }

  static getGluingType(symbol: string): FuturesGluingType | null {
    const match = symbol.match(this.isFuturesGluingRegex);
    if (match && match[1]) {
      const type = match[1].toUpperCase() as keyof typeof FuturesGluingType;
      return FuturesGluingType[type];
    }

    return null;
  }
}
