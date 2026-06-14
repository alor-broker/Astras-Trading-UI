import {Container} from 'pixi.js';
import {FrameContext} from '../render-contracts';

/**
 * Элемент отрисовки. Каждый элемент отвечает за одну изолированную часть сцены
 * и обновляется только когда изменились данные, от которых он зависит.
 */
export interface RenderElement {
  /** Контейнер элемента. Размещается фасадом внутри контейнера секции. */
  readonly container: Container;

  /** Битовая маска DirtyFlags, при которых элемент должен обновиться. */
  readonly interestMask: number;

  /**
   * Обновляет содержимое контейнера по текущему контексту кадра.
   * Координаты внутри элемента локальны относительно его секции:
   * x в диапазоне [0, width секции), y в координатах канвы.
   */
  update(ctx: FrameContext): void;

  destroy(): void;
}
