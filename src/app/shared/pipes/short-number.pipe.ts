import {
  Pipe,
  PipeTransform
} from '@angular/core';
import { MathHelper } from '../utils/math-helper';

@Pipe({
  name: 'shortNumber'
})
export class ShortNumberPipe implements PipeTransform {
  private readonly bases = [
    {
      base: 10 ** 12,
      suffix: 'T'
    },
    {
      base: 10 ** 9,
      suffix: 'B'
    },
    {
      base: 10 ** 6,
      suffix: 'M'
    },
    {
      base: 10 ** 3,
      suffix: 'K'
    }
  ];

  transform(value?: number | null, allowRounding = false, roundPrecision = 2): string {
    if (!value) {
      return '';
    }

    for (let base of this.bases) {
      const formattedValue = this.tryFormatToBase(
        value!,
        base.base,
        base.suffix,
        allowRounding,
        roundPrecision
      );

      if (formattedValue != null) {
        return formattedValue;
      }
    }

    return value.toString();
  }

  private tryFormatToBase(value: number, base: number, baseSuffix: string, allowRounding: boolean, roundPrecision: number): string | null {
    if (allowRounding) {
      if (value >= base) {
        const formattedValue = MathHelper.round(value / base, roundPrecision);
        return `${formattedValue}${baseSuffix}`;
      }

      return null;
    }
    else {
      if (value % base === 0) {
        return `${value / base}${baseSuffix}`;
      }

      return null;
    }
  }
}
