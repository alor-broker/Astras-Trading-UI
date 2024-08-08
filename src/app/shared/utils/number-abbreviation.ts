import { MathHelper } from "./math-helper";

export interface NumberAbbreviation {
  value: number;
  suffixName: string | null;
}

const numberBases = [
  {
    base: 10 ** 12,
    name: 'trillions'
  },
  {
    base: 10 ** 9,
    name: 'billions'
  },
  {
    base: 10 ** 6,
    name: 'millions'
  },
  {
    base: 10 ** 3,
    name: 'thousands'
  }
];

function tryFormatToBase(value: number, base: number, baseName: string, allowRounding: boolean, roundPrecision: number): NumberAbbreviation | null {
  if (allowRounding) {
    if (value! >= base) {
      const formattedValue = MathHelper.round(value! / base, roundPrecision);
      return {
        value: formattedValue,
        suffixName: baseName
      };
    }

    return null;
  }
  else {
    if (value! % base === 0) {
      return {
        value: value! / base,
        suffixName: baseName
      };
    }

    return null;
  }
}

export function getNumberAbbreviation(value: number | null | undefined, allowRounding = false, roundPrecision = 2): NumberAbbreviation | null {
  if (value == null) {
    return null;
  }

  if (value === 0) {
    return {
      value,
      suffixName: null
    };
  }

  for (const base of numberBases) {
    const displayData = tryFormatToBase(
      value,
      base.base,
      base.name,
      allowRounding,
      roundPrecision
    );

    if (displayData != null) {
      return displayData;
    }
  }

  return {
    value: value,
    suffixName: null
  };
}
