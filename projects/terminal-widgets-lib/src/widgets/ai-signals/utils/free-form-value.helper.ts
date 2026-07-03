export interface FreeFormNode {
  key: string;
  // formatted display value; null when the node has only children
  value: string | null;
  // true for structures below the depth cap: value contains their raw JSON dump
  // and is rendered as preformatted code (<code>) instead of a regular label
  isCode: boolean;
  children: FreeFormNode[];
}

// Renders unknown server dictionaries (technical_analysis, fundamental) whose structure is not guaranteed
export class FreeFormValueHelper {
  static toDisplayTree(data: Record<string, unknown>, maxDepth: number): FreeFormNode[] {
    return Object.entries(data)
      .map(([key, value]) => this.toNode(key, value, 0, maxDepth))
      .filter((node): node is FreeFormNode => node != null);
  }

  private static toNode(key: string, value: unknown, depth: number, maxDepth: number): FreeFormNode | null {
    if (value == null) {
      return null;
    }

    const primitiveValue = this.toPrimitiveDisplayValue(value);
    if (primitiveValue != null) {
      return this.createLeaf(key, primitiveValue, false);
    }

    // non-displayable primitives (blank strings, NaN, functions, etc.) must not fall
    // into Object.entries below — it would enumerate string characters
    if (typeof value !== 'object') {
      return null;
    }

    if (depth >= maxDepth) {
      return this.createLeaf(key, JSON.stringify(value), true);
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
      key,
      value: null,
      isCode: false,
      children
    };
  }

  private static toArrayNode(key: string, value: unknown[], depth: number, maxDepth: number): FreeFormNode | null {
    const items = value.filter(item => item != null);
    if (items.length === 0) {
      return null;
    }

    const primitiveValues = items.map(item => this.toPrimitiveDisplayValue(item));
    if (primitiveValues.every(item => item != null)) {
      return this.createLeaf(key, primitiveValues.join(', '), false);
    }

    const children = items
      .map((item, index) => this.toNode(`#${index + 1}`, item, depth + 1, maxDepth))
      .filter((node): node is FreeFormNode => node != null);

    if (children.length === 0) {
      return null;
    }

    return {
      key,
      value: null,
      isCode: false,
      children
    };
  }

  private static toPrimitiveDisplayValue(value: unknown): string | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value)
        ? String(Math.round(value * 10_000) / 10_000)
        : null;
    }

    if (typeof value === 'boolean') {
      return String(value);
    }

    return null;
  }

  private static createLeaf(key: string, value: string, isCode: boolean): FreeFormNode {
    return {
      key,
      value,
      isCode,
      children: []
    };
  }
}
