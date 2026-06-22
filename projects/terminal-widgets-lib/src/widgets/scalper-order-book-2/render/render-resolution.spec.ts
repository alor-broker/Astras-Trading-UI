import {
  afterEach,
  describe,
  expect,
  it
} from 'vitest';
import {getRenderResolution} from './render-resolution';

describe('getRenderResolution', () => {
  const originalDpr = globalThis.devicePixelRatio;

  const setDpr = (value: number | undefined): void => {
    Object.defineProperty(globalThis, 'devicePixelRatio', {
      value,
      configurable: true
    });
  };

  afterEach(() => {
    setDpr(originalDpr);
  });

  // Текст рисуется из атласа глифов, поэтому сцена должна супер-сэмплиться (>=2x)
  // даже при целом DPI - иначе субпиксельное положение глифов мылит.
  it('renders at 2x at integer DPI (100% scaling)', () => {
    setDpr(1);
    expect(getRenderResolution()).toBe(2);
  });

  // На дробном DPI (125%/150%) тоже 2x: целое разрешение >= dpr, но не плотнее 2x.
  it('stays at 2x for fractional DPI', () => {
    setDpr(1.25);
    expect(getRenderResolution()).toBe(2);

    setDpr(1.5);
    expect(getRenderResolution()).toBe(2);
  });

  // На 2x-экране это уже нативное 1:1; выше 2x ограничиваем стоимость заливки.
  it('caps at 2x for high DPI', () => {
    setDpr(2);
    expect(getRenderResolution()).toBe(2);

    setDpr(3);
    expect(getRenderResolution()).toBe(2);
  });

  // Защита от нулевого/неопределённого devicePixelRatio.
  it('falls back to 2x when devicePixelRatio is missing', () => {
    setDpr(0);
    expect(getRenderResolution()).toBe(2);

    setDpr(undefined);
    expect(getRenderResolution()).toBe(2);
  });
});
