import {Color} from 'pixi.js';
import {
  FillSpec,
  RenderThemeColors,
  ResolvedTheme
} from './render-contracts';

/** Преобразование CSS цветов в числовые цвета pixi. */
export class ColorHelper {
  static resolveFill(cssColor: string): FillSpec {
    const normalized = cssColor.trim();
    if (normalized === '') {
      return {color: 0x000000, alpha: 0};
    }

    try {
      const parsed = new Color(normalized);
      return {
        color: parsed.toNumber(),
        alpha: parsed.alpha
      };
    } catch {
      return {color: 0x000000, alpha: 0};
    }
  }

  /**
   * Аналог color-mix(in srgb, color X%, transparent):
   * исходный цвет с альфой, умноженной на долю.
   */
  static withAlpha(fill: FillSpec, alphaMultiplier: number): FillSpec {
    return {
      color: fill.color,
      alpha: fill.alpha * alphaMultiplier
    };
  }

  static resolveTheme(colors: RenderThemeColors): ResolvedTheme {
    return {
      buy: this.resolveFill(colors.buyColor),
      sell: this.resolveFill(colors.sellColor),
      mix: this.resolveFill(colors.mixColor),
      buyBackground: this.resolveFill(colors.buyColorBackground),
      sellBackground: this.resolveFill(colors.sellColorBackground),
      buyBackgroundLight: this.resolveFill(colors.buyColorBackgroundLight),
      buyAccent: this.resolveFill(colors.buyColorAccent),
      sellAccent: this.resolveFill(colors.sellColorAccent),
      buySellBtnText: this.resolveFill(colors.buySellBtnTextColor),
      componentBackground: this.resolveFill(colors.componentBackground),
      primary: this.resolveFill(colors.primaryColor),
      text: this.resolveFill(colors.textColor),
      textMaxContrast: this.resolveFill(colors.textMaxContrastColor),
      tableGrid: this.resolveFill(colors.tableGridColor),
      tableBorder: this.resolveFill(colors.tableBorderColor),
      disabled: this.resolveFill(colors.disabledColor),
      warning: this.resolveFill(colors.warningColor)
    };
  }
}
