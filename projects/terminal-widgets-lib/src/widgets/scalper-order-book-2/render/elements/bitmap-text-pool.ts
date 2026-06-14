import {
  BitmapText,
  Container
} from 'pixi.js';
import {
  FillSpec,
  FontProvider
} from '../render-contracts';

/**
 * Пул BitmapText объектов. Тексты переиспользуются между кадрами,
 * лишние скрываются, что исключает постоянное создание/удаление объектов.
 */
export class BitmapTextPool {
  private readonly items: BitmapText[] = [];

  private usedCount = 0;

  constructor(private readonly parent: Container) {
  }

  /** Начинает новый кадр. Вызывать перед размещением текстов. */
  beginFrame(): void {
    this.usedCount = 0;
  }

  /** Возвращает текст из пула, настроенный на указанные параметры. */
  place(
    fonts: FontProvider,
    text: string,
    fontSize: number,
    fill: FillSpec,
    x: number,
    y: number,
    anchorX: number,
    anchorY: number
  ): BitmapText {
    let item: BitmapText;

    if (this.usedCount < this.items.length) {
      item = this.items[this.usedCount];
      item.visible = true;
    } else {
      item = new BitmapText({
        text: '',
        style: {
          fontFamily: fonts.getFontFamily(fontSize),
          fontSize
        }
      });

      this.items.push(item);
      this.parent.addChild(item);
    }

    this.usedCount++;

    if (item.text !== text) {
      item.text = text;
    }

    // fontFamily сверяется всегда: имя шрифта включает resolution
    // и может смениться при переносе окна на другой монитор.
    const fontFamily = fonts.getFontFamily(fontSize);
    if (item.style.fontFamily !== fontFamily) {
      item.style.fontFamily = fontFamily;
    }

    if (item.style.fontSize !== fontSize) {
      item.style.fontSize = fontSize;
    }

    item.tint = fill.color;
    item.alpha = fill.alpha;
    item.anchor.set(anchorX, anchorY);
    item.x = x;
    item.y = y;

    return item;
  }

  /** Завершает кадр: скрывает неиспользованные тексты. */
  endFrame(): void {
    for (let i = this.usedCount; i < this.items.length; i++) {
      this.items[i].visible = false;
    }
  }

  destroy(): void {
    for (const item of this.items) {
      item.destroy();
    }

    this.items.length = 0;
    this.usedCount = 0;
  }
}
