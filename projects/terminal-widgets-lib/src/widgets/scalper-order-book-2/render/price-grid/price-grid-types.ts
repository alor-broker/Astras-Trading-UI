import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {
  BodyRow,
  ScalperOrderBookRowType
} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';

/**
 * Компактный дескриптор бесконечной виртуальной ценовой сетки.
 *
 * Сетка не материализуется и не имеет фиксированного размера: цена строки вычисляется
 * по формуле `price(g) = round(startPrice - g * scaledStep, pricePrecision)`, где `g` -
 * знаковый grid-индекс (0 = стартовая цена, рост индекса = убывание цены). Сетка
 * бесконечна в обе стороны: вверх - более высокие цены, вниз - вплоть до отрицательных
 * (есть инструменты с отрицательной ценой).
 */
export interface PriceGridDescriptor {
  instrumentKey: InstrumentKey;
  /** Цена строки с grid-индексом 0 (опорная цена сетки). */
  startPrice: number;
  /** Масштабированный шаг цены между соседними строками. */
  scaledStep: number;
  /** Точность округления цены (= getPrecision(scaledStep)). */
  pricePrecision: number;
  /** Базовый шаг инструмента (для разворачивания baseRange при масштабе). */
  basePriceStep: number;
  /** Текущий масштаб. */
  scaleFactor: number;
  /** Кратность minor-линий сетки (готовое значение для isMultipleOf). */
  minorLineValue: number;
  /** Кратность major-линий сетки. */
  majorLineValue: number;
  /** Сетка сгенерирована из последней цены без данных ордербука. */
  isDirty: boolean;
}

/** Диапазон цен текущей позиции для маркера в колонке цены. */
export interface PositionPriceRange {
  min: number;
  max: number;
  /** Знак зоны: > 0 - прибыльная (зеленая), < 0 - убыточная (красная). */
  sign: number;
}

/**
 * Полная модель отображения по видимому диапазону для бесконечной сетки.
 *
 * Сетка делится на зоны (grid-индексы знаковые):
 * - верхняя аффинная: `g < activeStartGrid`, бесконечна вверх, строки одного типа без объема;
 * - активная: `g in [activeStartGrid, activeEndGrid]`, материализованные строки `active`
 *   (с объемами/лучшими/спредом и возможным схлопыванием пустых уровней);
 * - нижняя аффинная: `g > activeEndGrid`, бесконечна вниз (вплоть до отрицательных цен).
 *
 * Аффинные зоны вычисляются по формуле, активная зона ограничена спаном ордербука.
 */
export interface DisplayModel {
  instrumentKey: InstrumentKey;
  startPrice: number;
  scaledStep: number;
  pricePrecision: number;
  basePriceStep: number;
  scaleFactor: number;
  minorLineValue: number;
  majorLineValue: number;

  /** Первый grid-индекс активной зоны (строки `g < activeStartGrid` - верхняя аффинная зона). */
  activeStartGrid: number;
  /** Последний grid-индекс активной зоны. */
  activeEndGrid: number;
  /** Материализованные строки активной зоны (после возможного схлопывания пустых уровней). */
  active: BodyRow[];

  /** Тип строк верхней аффинной зоны (Ask при наличии асков, иначе null). */
  affineTopRowType: ScalperOrderBookRowType | null;
  /** Тип строк нижней аффинной зоны (Bid при наличии бидов, иначе null). */
  affineBottomRowType: ScalperOrderBookRowType | null;

  /** Диапазон цен текущей позиции для аффинных строк (активные строки уже размечены). */
  positionRange: PositionPriceRange | null;

  /** Display-индекс строки для начального центрирования / выравнивания (середина спреда/лучшие). */
  centerDisplayIndex: number;
  /** Максимальный объем ask/bid по ордербуку (для подсветки BiggestVolume). */
  maxAskBidVolume: number;
  /** Дескриптор сгенерирован из последней цены без данных ордербука. */
  isDirty: boolean;
}
