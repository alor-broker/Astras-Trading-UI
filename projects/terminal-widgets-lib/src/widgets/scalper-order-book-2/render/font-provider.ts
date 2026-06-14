import {
  BitmapFont,
  BitmapFontManager,
  TextStyle
} from 'pixi.js';
import {FontProvider} from './render-contracts';

const FONT_FAMILY = 'Arial';
const FONT_NAME_PREFIX = 'ats-scob2';

/**
 * Глифы, которые могут понадобиться при отрисовке числовых значений:
 * цифры, разделители, суффиксы сокращенных чисел (K/M/B/T), маркеры заявок (SL/SM, *).
 */
const CHARS = '0123456789 .,()|*+-%xKMBTSL  −';

/**
 * Управляет bitmap-шрифтами, общими для всех экземпляров виджета.
 * Шрифт устанавливается один раз для каждой пары размер+resolution
 * и переиспользуется, текст красится через tint. При смене devicePixelRatio
 * (перенос окна на другой монитор) новые обращения устанавливают шрифты
 * с актуальным разрешением.
 */
export class SharedFontProvider implements FontProvider {
  private static instance: SharedFontProvider | null = null;

  private readonly installedFonts = new Map<string, string>();

  private readonly measureStyles = new Map<string, TextStyle>();

  static getInstance(): SharedFontProvider {
    SharedFontProvider.instance ??= new SharedFontProvider();

    return SharedFontProvider.instance;
  }

  getFontFamily(fontSize: number): string {
    const size = Math.round(fontSize);
    const resolution = this.getResolution();
    const key = `${size}:${resolution}`;

    let fontName = this.installedFonts.get(key);
    if (fontName == null) {
      fontName = `${FONT_NAME_PREFIX}-${size}-r${resolution}`;

      BitmapFont.install({
        name: fontName,
        style: {
          fontFamily: FONT_FAMILY,
          fontSize: size,
          fill: 0xffffff
        },
        chars: CHARS,
        resolution
      });

      this.installedFonts.set(key, fontName);
    }

    return fontName;
  }

  measureTextWidth(text: string, fontSize: number): number {
    const fontName = this.getFontFamily(fontSize);
    const size = Math.round(fontSize);

    let style = this.measureStyles.get(fontName);
    if (style == null) {
      style = new TextStyle({
        fontFamily: fontName,
        fontSize: size
      });

      this.measureStyles.set(fontName, style);
    }

    const measurement = BitmapFontManager.measureText(text, style);
    return measurement.width * measurement.scale;
  }

  private getResolution(): number {
    const dpr = globalThis.devicePixelRatio;
    return Math.min(Math.ceil(dpr > 0 ? dpr : 1), 2);
  }
}
