import {FloatingWindowBounds, FloatingWindowGeometryHelper} from './floating-window-geometry.helper';
import {FloatingWindowEdge} from '../types/floating-window.types';

describe('FloatingWindowGeometryHelper', () => {
  const bounds: FloatingWindowBounds = {width: 1000, height: 800, margin: 8,
    minWidth: 280, minHeight: 160, maxWidth: 984, maxHeight: 784};

  it('should center the initial window', () => {
    expect(FloatingWindowGeometryHelper.initial({width: 520, height: 400}, bounds))
      .toEqual({x: 240, y: 200, width: 520, height: 400});
  });

  it('should read non-enumerable browser DOMRect dimensions', () => {
    expect(FloatingWindowGeometryHelper.initial(new DOMRect(0, 0, 520, 400), bounds))
      .toEqual({x: 240, y: 200, width: 520, height: 400});
  });

  it('should offset from a click and keep the entire window on screen', () => {
    expect(FloatingWindowGeometryHelper.initial({width: 520, height: 400}, bounds,
      {x: 950, y: 790}, {x: 12, y: 12}))
      .toEqual({x: 472, y: 392, width: 520, height: 400});
    expect(FloatingWindowGeometryHelper.initial({width: 520, height: 400}, bounds,
      {x: 40, y: 60}, {x: -12, y: 12})).toMatchObject({x: 28, y: 72});
  });

  it('should reduce minimum dimensions on a small viewport', () => {
    expect(FloatingWindowGeometryHelper.constrain({x: -100, y: 900, width: 520, height: 400},
      {...bounds, width: 220, height: 150})).toEqual({x: 8, y: 8, width: 204, height: 134});
  });

  it('should clamp an existing window after the viewport shrinks', () => {
    expect(FloatingWindowGeometryHelper.constrain({x: 700, y: 500, width: 600, height: 500},
      {...bounds, width: 640, height: 480})).toEqual({x: 32, y: 8, width: 600, height: 464});
  });

  it('should retain the opposite corner when resizing a north west edge to its minimum', () => {
    expect(FloatingWindowGeometryHelper.resize({x: 100, y: 100, width: 500, height: 400},
      FloatingWindowEdge.NorthWest, {x: 900, y: 900}, bounds))
      .toEqual({x: 320, y: 340, width: 280, height: 160});
  });

  it('should stop a south east resize at viewport and configured limits', () => {
    expect(FloatingWindowGeometryHelper.resize({x: 100, y: 100, width: 500, height: 400},
      FloatingWindowEdge.SouthEast, {x: 900, y: 900}, {...bounds, maxWidth: 700}))
      .toEqual({x: 100, y: 100, width: 700, height: 692});
  });

  it('should normalize non-finite dimensions and coordinates', () => {
    expect(FloatingWindowGeometryHelper.constrain({x: NaN, y: Infinity, width: NaN, height: -1}, bounds))
      .toEqual({x: 8, y: 8, width: 280, height: 160});
  });
});
