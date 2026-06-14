import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {NumberAbbreviationHelper} from '@terminal-core-lib/common/utils/number-abbreviation.helper';
import {ValueFormatters} from './render-contracts';

const SHORT_SUFFIXES: Record<string, string> = {
  thousands: 'K',
  millions: 'M',
  billions: 'B',
  trillions: 'T'
};

/**
 * Форматирование чисел для отрисовки.
 * Повторяет поведение ats-short-number (короткие суффиксы) и atsPrice (DecimalPipe).
 */
export class FormatHelper implements ValueFormatters {
  private readonly numberFormatsCache = new Map<string, Intl.NumberFormat>();

  constructor(private readonly locale: string) {
  }

  formatVolume(value: number, format: NumberDisplayFormat): string {
    if (format === NumberDisplayFormat.LetterSuffix) {
      const abbreviation = NumberAbbreviationHelper.getNumberAbbreviation(value, true);
      if (abbreviation != null) {
        const suffix = abbreviation.suffixName != null
          ? SHORT_SUFFIXES[abbreviation.suffixName] ?? ''
          : '';

        return `${this.getNumberFormat(0, 10).format(abbreviation.value)}${suffix}`;
      }
    }

    // В формате по умолчанию объем выводится без группировки разрядов (как в DOM версии).
    return `${value}`;
  }

  formatPrice(value: number, decimalsCount: number | null): string {
    if (decimalsCount != null) {
      return this.getNumberFormat(decimalsCount, decimalsCount).format(value);
    }

    return this.getNumberFormat(0, 10).format(value);
  }

  private getNumberFormat(minFractionDigits: number, maxFractionDigits: number): Intl.NumberFormat {
    const key = `${minFractionDigits}_${maxFractionDigits}`;
    let format = this.numberFormatsCache.get(key);
    if (format == null) {
      format = new Intl.NumberFormat(
        this.locale,
        {
          minimumFractionDigits: minFractionDigits,
          maximumFractionDigits: maxFractionDigits,
          useGrouping: true
        }
      );

      this.numberFormatsCache.set(key, format);
    }

    return format;
  }
}
