export type FreeFormNodeType = 'group' | 'leaf';

export type FreeFormTrend = 'up' | 'down' | 'none';

export interface FreeFormNode {
  // human-readable label derived from the raw server key
  label: string;
  type: FreeFormNodeType;
  // formatted display value; null for groups
  value: string | null;
  isBoolean: boolean;
  booleanValue: boolean;
  // sign hint for change/percent metrics so the value can be colored
  trend: FreeFormTrend;
  children: FreeFormNode[];
}

// Renders unknown server dictionaries (technical_analysis, fundamental) whose structure is not guaranteed.
// Keys are humanized and values formatted so the block reads as a spec sheet rather than a raw JSON dump.
export class FreeFormValueHelper {
  // domain acronyms kept uppercase when humanizing keys
  private static readonly acronyms = new Set([
    'rsi', 'macd', 'sma', 'ema', 'atr', 'adx', 'adxr', 'cci', 'mfi', 'obv', 'vwap', 'bb',
    'sar', 'roc', 'cmf', 'ev', 'ebitda', 'orb', 'ad', 'id', 'k', 'd', 'r',
    'msfo', 'ifrs', 'usd', 'rub', 'eur', 'tf', 'atr'
  ]);

  // domain terms with a fixed mixed-case spelling
  private static readonly specialLabels: Record<string, string> = {
    yoy: 'YoY'
  };

  static toDisplayTree(data: Record<string, unknown>, maxDepth: number): FreeFormNode[] {
    return Object.entries(data)
      .map(([key, value]) => this.toNode(key, value, 0, maxDepth))
      .filter((node): node is FreeFormNode => node != null);
  }

  private static toNode(key: string, value: unknown, depth: number, maxDepth: number): FreeFormNode | null {
    if (value == null) {
      return null;
    }

    if (typeof value === 'boolean') {
      return this.createLeaf(this.humanizeKey(key), String(value), 'none', true, value);
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        return null;
      }

      const formatted = this.formatNumber(key, value);

      return this.createLeaf(this.humanizeKey(formatted.labelKey), formatted.display, formatted.trend, false, false);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      return trimmed.length > 0
        ? this.createLeaf(this.humanizeKey(key), trimmed, 'none', false, false)
        : null;
    }

    if (typeof value !== 'object') {
      return null;
    }

    if (depth >= maxDepth) {
      return this.createLeaf(this.humanizeKey(key), JSON.stringify(value), 'none', false, false);
    }

    if (Array.isArray(value)) {
      return this.toArrayNode(key, value, depth, maxDepth);
    }

    const children = Object.entries(value as Record<string, unknown>)
      .map(([childKey, childValue]) => this.toNode(childKey, childValue, depth + 1, maxDepth))
      .filter((node): node is FreeFormNode => node != null);

    if (children.length === 0) {
      return null;
    }

    return {
      label: this.humanizeKey(key),
      type: 'group',
      value: null,
      isBoolean: false,
      booleanValue: false,
      trend: 'none',
      children
    };
  }

  private static toArrayNode(key: string, value: unknown[], depth: number, maxDepth: number): FreeFormNode | null {
    const items = value.filter(item => item != null);
    if (items.length === 0) {
      return null;
    }

    const primitiveValues = items.map(item => this.toArrayItemDisplayValue(item));
    if (primitiveValues.every(item => item != null)) {
      return this.createLeaf(this.humanizeKey(key), primitiveValues.join(', '), 'none', false, false);
    }

    const children = items
      .map((item, index) => this.toNode(`#${index + 1}`, item, depth + 1, maxDepth))
      .filter((node): node is FreeFormNode => node != null);

    if (children.length === 0) {
      return null;
    }

    return {
      label: this.humanizeKey(key),
      type: 'group',
      value: null,
      isBoolean: false,
      booleanValue: false,
      trend: 'none',
      children
    };
  }

  private static toArrayItemDisplayValue(value: unknown): string | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value)
        ? this.formatPlainNumber(value)
        : null;
    }

    if (typeof value === 'boolean') {
      return String(value);
    }

    return null;
  }

  // yoy is a fraction (0.15 -> +15%); *_percent fields already carry a percentage (-4.44 -> -4.44%)
  private static formatNumber(key: string, value: number): {labelKey: string, display: string, trend: FreeFormTrend} {
    const lowerKey = key.toLowerCase();
    const isYoy = lowerKey === 'yoy';
    const isPercent = lowerKey.endsWith('_percent') || lowerKey.endsWith('_pct');

    if (isYoy || isPercent) {
      const percent = isYoy ? value * 100 : value;
      const rounded = Math.round(percent * 100) / 100;
      const sign = rounded > 0 ? '+' : '';
      const trend: FreeFormTrend = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'none';
      // drop the redundant "percent" suffix from the label since the value already shows %
      const labelKey = isPercent ? key.replace(/_percent$|_pct$/i, '') : key;

      return {labelKey, display: `${sign}${rounded}%`, trend};
    }

    return {labelKey: key, display: this.formatPlainNumber(value), trend: 'none'};
  }

  private static formatPlainNumber(value: number): string {
    const rounded = Math.round(value * 10_000) / 10_000;

    // group thousands for large magnitudes; keep small/decimal values verbatim
    if (Math.abs(rounded) >= 1_000 && Number.isInteger(rounded)) {
      return rounded.toLocaleString('en-US').replace(/,/g, ' ');
    }

    return String(rounded);
  }

  private static humanizeKey(key: string): string {
    const spaced = key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_\-/]+/g, ' ')
      .trim();

    const words = spaced.split(/\s+/).filter(word => word.length > 0);

    return words.map(word => this.humanizeWord(word)).join(' ');
  }

  private static humanizeWord(word: string): string {
    const lower = word.toLowerCase();

    if (this.specialLabels[lower] != null) {
      return this.specialLabels[lower];
    }

    if (this.acronyms.has(lower)) {
      return word.toUpperCase();
    }

    if (/^[#\d]/.test(word)) {
      return word;
    }

    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  private static createLeaf(
    label: string,
    value: string,
    trend: FreeFormTrend,
    isBoolean: boolean,
    booleanValue: boolean
  ): FreeFormNode {
    return {
      label,
      type: 'leaf',
      value,
      isBoolean,
      booleanValue,
      trend,
      children: []
    };
  }
}
