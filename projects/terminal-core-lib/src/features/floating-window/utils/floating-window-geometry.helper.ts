import {FloatingWindowEdge, FloatingWindowPoint, FloatingWindowRect} from '../types/floating-window.types';

export interface FloatingWindowBounds {
  width: number;
  height: number;
  margin: number;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

export class FloatingWindowGeometryHelper {
  static constrain(rect: FloatingWindowRect, bounds: FloatingWindowBounds): FloatingWindowRect {
    const availableWidth = Math.max(1, bounds.width - 2 * bounds.margin);
    const availableHeight = Math.max(1, bounds.height - 2 * bounds.margin);
    const maxWidth = Math.min(availableWidth, bounds.maxWidth);
    const maxHeight = Math.min(availableHeight, bounds.maxHeight);
    const width = this.clamp(rect.width, Math.min(bounds.minWidth, maxWidth), maxWidth);
    const height = this.clamp(rect.height, Math.min(bounds.minHeight, maxHeight), maxHeight);
    return {
      width,
      height,
      x: this.clamp(rect.x, bounds.margin, Math.max(bounds.margin, bounds.width - bounds.margin - width)),
      y: this.clamp(rect.y, bounds.margin, Math.max(bounds.margin, bounds.height - bounds.margin - height))
    };
  }

  static initial(size: {width: number, height: number}, bounds: FloatingWindowBounds,
                 origin?: FloatingWindowPoint, offset: FloatingWindowPoint = {x: 0, y: 0}): FloatingWindowRect {
    const rect = this.constrain({width: size.width, height: size.height, x: 0, y: 0}, bounds);
    return this.constrain({...rect,
      x: origin == null ? (bounds.width - rect.width) / 2 : origin.x + offset.x,
      y: origin == null ? (bounds.height - rect.height) / 2 : origin.y + offset.y
    }, bounds);
  }

  static resize(rect: FloatingWindowRect, edge: FloatingWindowEdge, delta: FloatingWindowPoint,
                bounds: FloatingWindowBounds): FloatingWindowRect {
    const west = edge.includes('w');
    const north = edge.includes('n');
    const horizontal = west || edge.includes('e');
    const vertical = north || edge.includes('s');
    const maxWidth = Math.min(bounds.maxWidth, west
      ? rect.x + rect.width - bounds.margin
: bounds.width - bounds.margin - rect.x);
    const maxHeight = Math.min(bounds.maxHeight, north
      ? rect.y + rect.height - bounds.margin
: bounds.height - bounds.margin - rect.y);
    const width = horizontal
? this.clamp(rect.width + (west ? -delta.x : delta.x),
      Math.min(bounds.minWidth, maxWidth), maxWidth)
: rect.width;
    const height = vertical
? this.clamp(rect.height + (north ? -delta.y : delta.y),
      Math.min(bounds.minHeight, maxHeight), maxHeight)
: rect.height;
    return this.constrain({width, height,
      x: west ? rect.x + rect.width - width : rect.x,
      y: north ? rect.y + rect.height - height : rect.y
    }, bounds);
  }

  private static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(Number.isFinite(value) ? value : min, max));
  }
}
