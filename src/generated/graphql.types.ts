/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  Decimal: { input: number; output: number; }
  Long: { input: number; output: number; }
}

export interface AdditionalInformation {
  /** Дата и время (UTC) окончания действия */
  cancellation: Scalars['DateTime']['output'];
  /** Требуемая категория для осуществления торговли инструментом */
  complexProductCategory?: Maybe<Scalars['String']['output']>;
  /** Множитель цены, использующийся при расчёте объёма */
  priceMultiplier: Scalars['Decimal']['output'];
  /** Количество единиц валютного инструмента, за которое указывается курс в котировках. Для прочих инструментов значение всегда равно 1 */
  priceShownUnits: Scalars['Decimal']['output'];
}

export interface AdditionalInformationFilterInput {
  and?: InputMaybe<Array<AdditionalInformationFilterInput>>;
  /** Дата и время (UTC) окончания действия */
  cancellation?: InputMaybe<DateTimeOperationFilterInput>;
  /** Требуемая категория для осуществления торговли инструментом */
  complexProductCategory?: InputMaybe<StringOperationFilterInput>;
  or?: InputMaybe<Array<AdditionalInformationFilterInput>>;
  /** Множитель цены, использующийся при расчёте объёма */
  priceMultiplier?: InputMaybe<DecimalOperationFilterInput>;
  /** Количество единиц валютного инструмента, за которое указывается курс в котировках. Для прочих инструментов значение всегда равно 1 */
  priceShownUnits?: InputMaybe<DecimalOperationFilterInput>;
}

export interface AdditionalInformationSortInput {
  /** Дата и время (UTC) окончания действия */
  cancellation?: InputMaybe<SortEnumType>;
  /** Требуемая категория для осуществления торговли инструментом */
  complexProductCategory?: InputMaybe<SortEnumType>;
  /** Множитель цены, использующийся при расчёте объёма */
  priceMultiplier?: InputMaybe<SortEnumType>;
  /** Количество единиц валютного инструмента, за которое указывается курс в котировках. Для прочих инструментов значение всегда равно 1 */
  priceShownUnits?: InputMaybe<SortEnumType>;
}

export interface Amortization {
  /** Выплата на одну облигацию */
  amount: Scalars['Decimal']['output'];
  /** Цена выкупа, в процентах от номинала(чистая) */
  buyBackPrice?: Maybe<Scalars['Decimal']['output']>;
  /** Валюта выплаты */
  currency?: Maybe<Scalars['String']['output']>;
  /** Дата события */
  date: Scalars['DateTime']['output'];
  /** Дата фиксации владельцев для участия в событии */
  fixDate?: Maybe<Scalars['DateTime']['output']>;
  /** Признак наличия ближайшего события */
  isClosest: Scalars['Boolean']['output'];
  /** Процент погашения */
  parFraction: Scalars['Decimal']['output'];
  /** Ставка купона, доля номинала, цена выкупа или коэффициент конвертации */
  value?: Maybe<Scalars['Decimal']['output']>;
}

export interface AmortizationFilterInput {
  /** Выплата на одну облигацию */
  amount?: InputMaybe<DecimalOperationFilterInput>;
  and?: InputMaybe<Array<AmortizationFilterInput>>;
  /** Цена выкупа, в процентах от номинала(чистая) */
  buyBackPrice?: InputMaybe<DecimalOperationFilterInput>;
  /** Валюта выплаты */
  currency?: InputMaybe<StringOperationFilterInput>;
  /** Дата события */
  date?: InputMaybe<DateTimeOperationFilterInput>;
  /** Дата фиксации владельцев для участия в событии */
  fixDate?: InputMaybe<DateTimeOperationFilterInput>;
  /** Признак наличия ближайшего события */
  isClosest?: InputMaybe<BooleanOperationFilterInput>;
  or?: InputMaybe<Array<AmortizationFilterInput>>;
  /** Процент погашения */
  parFraction?: InputMaybe<DecimalOperationFilterInput>;
  /** Ставка купона, доля номинала, цена выкупа или коэффициент конвертации */
  value?: InputMaybe<DecimalOperationFilterInput>;
}

export interface AmortizationSortInput {
  /** Выплата на одну облигацию */
  amount?: InputMaybe<SortEnumType>;
  /** Цена выкупа, в процентах от номинала(чистая) */
  buyBackPrice?: InputMaybe<SortEnumType>;
  /** Валюта выплаты */
  currency?: InputMaybe<SortEnumType>;
  /** Дата события */
  date?: InputMaybe<SortEnumType>;
  /** Дата фиксации владельцев для участия в событии */
  fixDate?: InputMaybe<SortEnumType>;
  /** Признак наличия ближайшего события */
  isClosest?: InputMaybe<SortEnumType>;
  /** Процент погашения */
  parFraction?: InputMaybe<SortEnumType>;
  /** Ставка купона, доля номинала, цена выкупа или коэффициент конвертации */
  value?: InputMaybe<SortEnumType>;
}

export enum ApplyPolicy {
  AfterResolver = 'AFTER_RESOLVER',
  BeforeResolver = 'BEFORE_RESOLVER',
  Validation = 'VALIDATION'
}

export interface BasicInformation {
  /** Требуемая категория для осуществления торговли инструментом */
  complexProductCategory: Scalars['String']['output'];
  /** Краткое описание инструмента */
  description: Scalars['String']['output'];
  /** Биржа */
  exchange: Exchange;
  /** Полное описание инструмента */
  fullDescription: Scalars['String']['output'];
  /** Полное имя эмитента */
  fullName?: Maybe<Scalars['String']['output']>;
  /** Сектор деятельности эмитента по стандарту GICS */
  gicsSector?: Maybe<Scalars['String']['output']>;
  /** Рынок */
  market: Market;
  /** Читаемый тип финансового инструмента */
  readableType?: Maybe<Scalars['String']['output']>;
  /** Сектор деятельности эмитента */
  sector?: Maybe<Scalars['String']['output']>;
  /** Краткое наименование инструмента */
  shortName: Scalars['String']['output'];
  /** Тикер (Код финансового инструмента) */
  symbol: Scalars['String']['output'];
  /** Тип финансового инструмента */
  type?: Maybe<Scalars['String']['output']>;
}

export interface BasicInformationFilterInput {
  and?: InputMaybe<Array<BasicInformationFilterInput>>;
  /** Требуемая категория для осуществления торговли инструментом */
  complexProductCategory?: InputMaybe<StringOperationFilterInput>;
  /** Краткое описание инструмента */
  description?: InputMaybe<StringOperationFilterInput>;
  /** Биржа */
  exchange?: InputMaybe<ExchangeOperationFilterInput>;
  /** Полное описание инструмента */
  fullDescription?: InputMaybe<StringOperationFilterInput>;
  /** Полное имя эмитента */
  fullName?: InputMaybe<StringOperationFilterInput>;
  /** Сектор деятельности эмитента по стандарту GICS */
  gicsSector?: InputMaybe<StringOperationFilterInput>;
  /** Рынок */
  market?: InputMaybe<MarketOperationFilterInput>;
  or?: InputMaybe<Array<BasicInformationFilterInput>>;
  /** Читаемый тип финансового инструмента */
  readableType?: InputMaybe<StringOperationFilterInput>;
  /** Сектор деятельности эмитента */
  sector?: InputMaybe<StringOperationFilterInput>;
  /** Краткое наименование инструмента */
  shortName?: InputMaybe<StringOperationFilterInput>;
  /** Тикер (Код финансового инструмента) */
  symbol?: InputMaybe<StringOperationFilterInput>;
  /** Тип финансового инструмента */
  type?: InputMaybe<StringOperationFilterInput>;
}

export interface BasicInformationSortInput {
  /** Требуемая категория для осуществления торговли инструментом */
  complexProductCategory?: InputMaybe<SortEnumType>;
  /** Краткое описание инструмента */
  description?: InputMaybe<SortEnumType>;
  /** Биржа */
  exchange?: InputMaybe<SortEnumType>;
  /** Полное описание инструмента */
  fullDescription?: InputMaybe<SortEnumType>;
  /** Полное имя эмитента */
  fullName?: InputMaybe<SortEnumType>;
  /** Сектор деятельности эмитента по стандарту GICS */
  gicsSector?: InputMaybe<SortEnumType>;
  /** Рынок */
  market?: InputMaybe<SortEnumType>;
  /** Читаемый тип финансового инструмента */
  readableType?: InputMaybe<SortEnumType>;
  /** Сектор деятельности эмитента */
  sector?: InputMaybe<SortEnumType>;
  /** Краткое наименование инструмента */
  shortName?: InputMaybe<SortEnumType>;
  /** Тикер (Код финансового инструмента) */
  symbol?: InputMaybe<SortEnumType>;
  /** Тип финансового инструмента */
  type?: InputMaybe<SortEnumType>;
}

export interface BoardInformation {
  /** Код режима торгов */
  board: Scalars['String']['output'];
  /** Флаг, показывающий является ли данный режим торгов базовым */
  isPrimaryBoard: Scalars['Boolean']['output'];
  /** Код базового режима торгов */
  primaryBoard: Scalars['String']['output'];
}

export interface BoardInformationFilterInput {
  and?: InputMaybe<Array<BoardInformationFilterInput>>;
  /** Код режима торгов */
  board?: InputMaybe<StringOperationFilterInput>;
  /** Флаг, показывающий является ли данный режим торгов базовым */
  isPrimaryBoard?: InputMaybe<BooleanOperationFilterInput>;
  or?: InputMaybe<Array<BoardInformationFilterInput>>;
  /** Код базового режима торгов */
  primaryBoard?: InputMaybe<StringOperationFilterInput>;
}

export interface BoardInformationSortInput {
  /** Код режима торгов */
  board?: InputMaybe<SortEnumType>;
  /** Флаг, показывающий является ли данный режим торгов базовым */
  isPrimaryBoard?: InputMaybe<SortEnumType>;
  /** Код базового режима торгов */
  primaryBoard?: InputMaybe<SortEnumType>;
}

export interface Bond extends Instrument {
  additionalInformation: AdditionalInformation;
  /** События погашений выпусков */
  amortizations?: Maybe<Array<Amortization>>;
  basicInformation: BasicInformation;
  boardInformation: BoardInformation;
  /** Ставка купона, процентов годовых */
  couponRate?: Maybe<Scalars['Decimal']['output']>;
  /** Тип купона */
  couponType?: Maybe<CouponType>;
  /** События выплат купонов */
  coupons?: Maybe<Array<Coupon>>;
  currencyInformation: CurrencyInformation;
  /** Остаточный номинал */
  currentFaceValue: Scalars['Decimal']['output'];
  /** Дюрация модифицированная, % */
  duration?: Maybe<Scalars['Decimal']['output']>;
  /** Дюрация по Маколею, дней */
  durationMacaulay?: Maybe<Scalars['Int']['output']>;
  /** Номинал */
  faceValue: Scalars['Decimal']['output'];
  financialAttributes: FinancialAttributes;
  /** Признак наличия по выпуску гарантии */
  guaranteed: Scalars['Boolean']['output'];
  /** Признак наличия по погашениям выпусков */
  hasAmortization: Scalars['Boolean']['output'];
  /** Признак наличия по выпуску возможности досрочного выкупа или погашения */
  hasOffer: Scalars['Boolean']['output'];
  /** Эмитент */
  issuer?: Maybe<Scalars['String']['output']>;
  /** Дата погашения */
  maturityDate?: Maybe<Scalars['DateTime']['output']>;
  /** События досрочных выкупов/оферт */
  offers?: Maybe<Array<Offer>>;
  /** Дата окончания размещения */
  placementEndDate?: Maybe<Scalars['DateTime']['output']>;
  /** Признак наличия по продаже и залогу активов */
  pledged: Scalars['Boolean']['output'];
  tradingDetails: TradingDetails;
  /** Объемы */
  volumes?: Maybe<BondVolumes>;
  /** Доходность */
  yield?: Maybe<BondYield>;
}


export interface BondAmortizationsArgs {
  order?: InputMaybe<Array<AmortizationSortInput>>;
  where?: InputMaybe<AmortizationFilterInput>;
}


export interface BondCouponsArgs {
  order?: InputMaybe<Array<CouponSortInput>>;
  where?: InputMaybe<CouponFilterInput>;
}


export interface BondOffersArgs {
  order?: InputMaybe<Array<OfferSortInput>>;
  where?: InputMaybe<OfferFilterInput>;
}

export enum BondEventType {
  Call = 'CALL',
  Cpn = 'CPN',
  Mty = 'MTY',
  Put = 'PUT'
}

export interface BondEventTypeOperationFilterInput {
  eq?: InputMaybe<BondEventType>;
  in?: InputMaybe<Array<BondEventType>>;
  neq?: InputMaybe<BondEventType>;
  nin?: InputMaybe<Array<BondEventType>>;
}

export interface BondFilterInput {
  additionalInformation?: InputMaybe<AdditionalInformationFilterInput>;
  /** События погашений выпусков */
  amortizations?: InputMaybe<ListFilterInputTypeOfAmortizationFilterInput>;
  and?: InputMaybe<Array<BondFilterInput>>;
  basicInformation?: InputMaybe<BasicInformationFilterInput>;
  boardInformation?: InputMaybe<BoardInformationFilterInput>;
  /** Ставка купона, процентов годовых */
  couponRate?: InputMaybe<DecimalOperationFilterInput>;
  /** Тип купона */
  couponType?: InputMaybe<NullableOfCouponTypeOperationFilterInput>;
  /** События выплат купонов */
  coupons?: InputMaybe<ListFilterInputTypeOfCouponFilterInput>;
  currencyInformation?: InputMaybe<CurrencyInformationFilterInput>;
  /** Остаточный номинал */
  currentFaceValue?: InputMaybe<DecimalOperationFilterInput>;
  /** Дюрация модифицированная, % */
  duration?: InputMaybe<DecimalOperationFilterInput>;
  /** Дюрация по Маколею, дней */
  durationMacaulay?: InputMaybe<IntOperationFilterInput>;
  /** Номинал */
  faceValue?: InputMaybe<DecimalOperationFilterInput>;
  financialAttributes?: InputMaybe<FinancialAttributesFilterInput>;
  /** Признак наличия по выпуску гарантии */
  guaranteed?: InputMaybe<BooleanOperationFilterInput>;
  /** Признак наличия по погашениям выпусков */
  hasAmortization?: InputMaybe<BooleanOperationFilterInput>;
  /** Признак наличия по выпуску возможности досрочного выкупа или погашения */
  hasOffer?: InputMaybe<BooleanOperationFilterInput>;
  /** Эмитент */
  issuer?: InputMaybe<StringOperationFilterInput>;
  /** Дата погашения */
  maturityDate?: InputMaybe<DateTimeOperationFilterInput>;
  /** События досрочных выкупов/оферт */
  offers?: InputMaybe<ListFilterInputTypeOfOfferFilterInput>;
  or?: InputMaybe<Array<BondFilterInput>>;
  /** Дата окончания размещения */
  placementEndDate?: InputMaybe<DateTimeOperationFilterInput>;
  /** Признак наличия по продаже и залогу активов */
  pledged?: InputMaybe<BooleanOperationFilterInput>;
  tradingDetails?: InputMaybe<TradingDetailsFilterInput>;
  /** Объемы */
  volumes?: InputMaybe<BondVolumesFilterInput>;
  /** Доходность */
  yield?: InputMaybe<BondYieldFilterInput>;
}

export interface BondSortInput {
  additionalInformation?: InputMaybe<AdditionalInformationSortInput>;
  basicInformation?: InputMaybe<BasicInformationSortInput>;
  boardInformation?: InputMaybe<BoardInformationSortInput>;
  /** Ставка купона, процентов годовых */
  couponRate?: InputMaybe<SortEnumType>;
  /** Тип купона */
  couponType?: InputMaybe<SortEnumType>;
  currencyInformation?: InputMaybe<CurrencyInformationSortInput>;
  /** Остаточный номинал */
  currentFaceValue?: InputMaybe<SortEnumType>;
  /** Дюрация модифицированная, % */
  duration?: InputMaybe<SortEnumType>;
  /** Дюрация по Маколею, дней */
  durationMacaulay?: InputMaybe<SortEnumType>;
  /** Номинал */
  faceValue?: InputMaybe<SortEnumType>;
  financialAttributes?: InputMaybe<FinancialAttributesSortInput>;
  /** Признак наличия по выпуску гарантии */
  guaranteed?: InputMaybe<SortEnumType>;
  /** Признак наличия по погашениям выпусков */
  hasAmortization?: InputMaybe<SortEnumType>;
  /** Признак наличия по выпуску возможности досрочного выкупа или погашения */
  hasOffer?: InputMaybe<SortEnumType>;
  /** Эмитент */
  issuer?: InputMaybe<SortEnumType>;
  /** Дата погашения */
  maturityDate?: InputMaybe<SortEnumType>;
  /** Дата окончания размещения */
  placementEndDate?: InputMaybe<SortEnumType>;
  /** Признак наличия по продаже и залогу активов */
  pledged?: InputMaybe<SortEnumType>;
  tradingDetails?: InputMaybe<TradingDetailsSortInput>;
  /** Объемы */
  volumes?: InputMaybe<BondVolumesSortInput>;
  /** Доходность */
  yield?: InputMaybe<BondYieldSortInput>;
}

export interface BondVolumes {
  /** Объем выпуска (в деньгах) */
  issueValue: Scalars['Decimal']['output'];
  /** Объем выпуска (в штуках) */
  issueVolume: Scalars['Decimal']['output'];
  /** Объем в обращении (в деньгах) */
  marketValue: Scalars['Decimal']['output'];
  /** Объем в обращении (в штуках) */
  marketVolume: Scalars['Decimal']['output'];
}

export interface BondVolumesFilterInput {
  and?: InputMaybe<Array<BondVolumesFilterInput>>;
  /** Объем выпуска (в деньгах) */
  issueValue?: InputMaybe<DecimalOperationFilterInput>;
  /** Объем выпуска (в штуках) */
  issueVolume?: InputMaybe<DecimalOperationFilterInput>;
  /** Объем в обращении (в деньгах) */
  marketValue?: InputMaybe<DecimalOperationFilterInput>;
  /** Объем в обращении (в штуках) */
  marketVolume?: InputMaybe<DecimalOperationFilterInput>;
  or?: InputMaybe<Array<BondVolumesFilterInput>>;
}

export interface BondVolumesSortInput {
  /** Объем выпуска (в деньгах) */
  issueValue?: InputMaybe<SortEnumType>;
  /** Объем выпуска (в штуках) */
  issueVolume?: InputMaybe<SortEnumType>;
  /** Объем в обращении (в деньгах) */
  marketValue?: InputMaybe<SortEnumType>;
  /** Объем в обращении (в штуках) */
  marketVolume?: InputMaybe<SortEnumType>;
}

export interface BondYield {
  /** Текущая доходность по последней цене, % */
  currentYield: Scalars['Decimal']['output'];
  /** Доходность к погашению, % */
  yieldToMaturity: Scalars['Decimal']['output'];
}

export interface BondYieldFilterInput {
  and?: InputMaybe<Array<BondYieldFilterInput>>;
  /** Текущая доходность по последней цене, % */
  currentYield?: InputMaybe<DecimalOperationFilterInput>;
  or?: InputMaybe<Array<BondYieldFilterInput>>;
  /** Доходность к погашению, % */
  yieldToMaturity?: InputMaybe<DecimalOperationFilterInput>;
}

export interface BondYieldSortInput {
  /** Текущая доходность по последней цене, % */
  currentYield?: InputMaybe<SortEnumType>;
  /** Доходность к погашению, % */
  yieldToMaturity?: InputMaybe<SortEnumType>;
}

/** A connection to a list of items. */
export interface BondsConnection {
  /** A list of edges. */
  edges?: Maybe<Array<BondsEdge>>;
  /** A flattened list of the nodes. */
  nodes?: Maybe<Array<Bond>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  totalCount: Scalars['Int']['output'];
}

/** An edge in a connection. */
export interface BondsEdge {
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Bond;
}

export interface BooleanOperationFilterInput {
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  neq?: InputMaybe<Scalars['Boolean']['input']>;
}

export interface CostEstimate {
  /** Показатель оценки прибыли на акцию (EPS), если были реализованы все конвертируемые ценные бумаги */
  dilutedEarningsPerShare: Scalars['Decimal']['output'];
  /** Отношение рыночной цены актива к количеству акций */
  pricePerShare: Scalars['Decimal']['output'];
  /** Отношение рыночной цены актива к ее прибыли */
  priceToEarnings: Scalars['Decimal']['output'];
}

export interface CostEstimateFilterInput {
  and?: InputMaybe<Array<CostEstimateFilterInput>>;
  /** Показатель оценки прибыли на акцию (EPS), если были реализованы все конвертируемые ценные бумаги */
  dilutedEarningsPerShare?: InputMaybe<DecimalOperationFilterInput>;
  or?: InputMaybe<Array<CostEstimateFilterInput>>;
  /** Отношение рыночной цены актива к количеству акций */
  pricePerShare?: InputMaybe<DecimalOperationFilterInput>;
  /** Отношение рыночной цены актива к ее прибыли */
  priceToEarnings?: InputMaybe<DecimalOperationFilterInput>;
}

export interface CostEstimateSortInput {
  /** Показатель оценки прибыли на акцию (EPS), если были реализованы все конвертируемые ценные бумаги */
  dilutedEarningsPerShare?: InputMaybe<SortEnumType>;
  /** Отношение рыночной цены актива к количеству акций */
  pricePerShare?: InputMaybe<SortEnumType>;
  /** Отношение рыночной цены актива к ее прибыли */
  priceToEarnings?: InputMaybe<SortEnumType>;
}

export interface Coupon {
  /** НКД */
  accruedInterest: Scalars['Decimal']['output'];
  /** Выплата на одну облигацию */
  amount: Scalars['Decimal']['output'];
  /** Ставка купона, процентов годовых */
  couponRate?: Maybe<Scalars['Decimal']['output']>;
  /** Тип купона (плавающий, фиксированный) */
  couponType: CouponType;
  /** Валюта выплаты */
  currency?: Maybe<Scalars['String']['output']>;
  /** Дата события */
  date: Scalars['DateTime']['output'];
  /** Дата фиксации владельцев для участия в событии */
  fixDate?: Maybe<Scalars['DateTime']['output']>;
  /** Интервал между выплатами */
  intervalInDays: Scalars['Decimal']['output'];
  /** Признак наличия ближайшего события */
  isClosest: Scalars['Boolean']['output'];
  /** Ставка купона, доля номинала, цена выкупа или коэффициент конвертации */
  value?: Maybe<Scalars['Decimal']['output']>;
}

export interface CouponFilterInput {
  /** НКД */
  accruedInterest?: InputMaybe<DecimalOperationFilterInput>;
  /** Выплата на одну облигацию */
  amount?: InputMaybe<DecimalOperationFilterInput>;
  and?: InputMaybe<Array<CouponFilterInput>>;
  /** Ставка купона, процентов годовых */
  couponRate?: InputMaybe<DecimalOperationFilterInput>;
  /** Тип купона (плавающий, фиксированный) */
  couponType?: InputMaybe<CouponTypeOperationFilterInput>;
  /** Валюта выплаты */
  currency?: InputMaybe<StringOperationFilterInput>;
  /** Дата события */
  date?: InputMaybe<DateTimeOperationFilterInput>;
  /** Дата фиксации владельцев для участия в событии */
  fixDate?: InputMaybe<DateTimeOperationFilterInput>;
  /** Интервал между выплатами */
  intervalInDays?: InputMaybe<DecimalOperationFilterInput>;
  /** Признак наличия ближайшего события */
  isClosest?: InputMaybe<BooleanOperationFilterInput>;
  or?: InputMaybe<Array<CouponFilterInput>>;
  /** Ставка купона, доля номинала, цена выкупа или коэффициент конвертации */
  value?: InputMaybe<DecimalOperationFilterInput>;
}

export interface CouponSortInput {
  /** НКД */
  accruedInterest?: InputMaybe<SortEnumType>;
  /** Выплата на одну облигацию */
  amount?: InputMaybe<SortEnumType>;
  /** Ставка купона, процентов годовых */
  couponRate?: InputMaybe<SortEnumType>;
  /** Тип купона (плавающий, фиксированный) */
  couponType?: InputMaybe<SortEnumType>;
  /** Валюта выплаты */
  currency?: InputMaybe<SortEnumType>;
  /** Дата события */
  date?: InputMaybe<SortEnumType>;
  /** Дата фиксации владельцев для участия в событии */
  fixDate?: InputMaybe<SortEnumType>;
  /** Интервал между выплатами */
  intervalInDays?: InputMaybe<SortEnumType>;
  /** Признак наличия ближайшего события */
  isClosest?: InputMaybe<SortEnumType>;
  /** Ставка купона, доля номинала, цена выкупа или коэффициент конвертации */
  value?: InputMaybe<SortEnumType>;
}

export enum CouponType {
  Fixed = 'FIXED',
  Float = 'FLOAT',
  Unknown = 'UNKNOWN'
}

export interface CouponTypeOperationFilterInput {
  eq?: InputMaybe<CouponType>;
  in?: InputMaybe<Array<CouponType>>;
  neq?: InputMaybe<CouponType>;
  nin?: InputMaybe<Array<CouponType>>;
}

/** A connection to a list of items. */
export interface CurrenciesConnection {
  /** A list of edges. */
  edges?: Maybe<Array<CurrenciesEdge>>;
  /** A flattened list of the nodes. */
  nodes?: Maybe<Array<Currency>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  totalCount: Scalars['Int']['output'];
}

/** An edge in a connection. */
export interface CurrenciesEdge {
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Currency;
}

export interface Currency extends Instrument {
  additionalInformation: AdditionalInformation;
  basicInformation: BasicInformation;
  boardInformation: BoardInformation;
  currencyInformation: CurrencyInformation;
  financialAttributes: FinancialAttributes;
  tradingDetails: TradingDetails;
}

export interface CurrencyFilterInput {
  additionalInformation?: InputMaybe<AdditionalInformationFilterInput>;
  and?: InputMaybe<Array<CurrencyFilterInput>>;
  basicInformation?: InputMaybe<BasicInformationFilterInput>;
  boardInformation?: InputMaybe<BoardInformationFilterInput>;
  currencyInformation?: InputMaybe<CurrencyInformationFilterInput>;
  financialAttributes?: InputMaybe<FinancialAttributesFilterInput>;
  or?: InputMaybe<Array<CurrencyFilterInput>>;
  tradingDetails?: InputMaybe<TradingDetailsFilterInput>;
}

export interface CurrencyInformation {
  /** Валюта номинала */
  nominal?: Maybe<Scalars['String']['output']>;
  /** Валюта расчета */
  settlement?: Maybe<Scalars['String']['output']>;
}

export interface CurrencyInformationFilterInput {
  and?: InputMaybe<Array<CurrencyInformationFilterInput>>;
  /** Валюта номинала */
  nominal?: InputMaybe<StringOperationFilterInput>;
  or?: InputMaybe<Array<CurrencyInformationFilterInput>>;
  /** Валюта расчета */
  settlement?: InputMaybe<StringOperationFilterInput>;
}

export interface CurrencyInformationSortInput {
  /** Валюта номинала */
  nominal?: InputMaybe<SortEnumType>;
  /** Валюта расчета */
  settlement?: InputMaybe<SortEnumType>;
}

export interface CurrencySortInput {
  additionalInformation?: InputMaybe<AdditionalInformationSortInput>;
  basicInformation?: InputMaybe<BasicInformationSortInput>;
  boardInformation?: InputMaybe<BoardInformationSortInput>;
  currencyInformation?: InputMaybe<CurrencyInformationSortInput>;
  financialAttributes?: InputMaybe<FinancialAttributesSortInput>;
  tradingDetails?: InputMaybe<TradingDetailsSortInput>;
}

export interface DateTimeOperationFilterInput {
  eq?: InputMaybe<Scalars['DateTime']['input']>;
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  neq?: InputMaybe<Scalars['DateTime']['input']>;
  ngt?: InputMaybe<Scalars['DateTime']['input']>;
  ngte?: InputMaybe<Scalars['DateTime']['input']>;
  nin?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  nlt?: InputMaybe<Scalars['DateTime']['input']>;
  nlte?: InputMaybe<Scalars['DateTime']['input']>;
}

export interface DecimalOperationFilterInput {
  eq?: InputMaybe<Scalars['Decimal']['input']>;
  gt?: InputMaybe<Scalars['Decimal']['input']>;
  gte?: InputMaybe<Scalars['Decimal']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Decimal']['input']>>>;
  lt?: InputMaybe<Scalars['Decimal']['input']>;
  lte?: InputMaybe<Scalars['Decimal']['input']>;
  neq?: InputMaybe<Scalars['Decimal']['input']>;
  ngt?: InputMaybe<Scalars['Decimal']['input']>;
  ngte?: InputMaybe<Scalars['Decimal']['input']>;
  nin?: InputMaybe<Array<InputMaybe<Scalars['Decimal']['input']>>>;
  nlt?: InputMaybe<Scalars['Decimal']['input']>;
  nlte?: InputMaybe<Scalars['Decimal']['input']>;
}

export interface Derivative extends Instrument {
  additionalInformation: AdditionalInformation;
  basicInformation: BasicInformation;
  boardInformation: BoardInformation;
  currencyInformation: CurrencyInformation;
  financialAttributes: FinancialAttributes;
  /** Базовое ГО */
  initialMargin: InitialMargin;
  /** Цена маржинальной покупки (заемные средства) */
  marginBuy?: Maybe<Scalars['Decimal']['output']>;
  /** Отношение цены маржинальной покупки к цене последней сделки */
  marginRate?: Maybe<Scalars['Decimal']['output']>;
  /** Цена маржинальной продажи (заемные средства) */
  marginSell?: Maybe<Scalars['Decimal']['output']>;
  /** Теоретическая цена опциона */
  theorPrice: Scalars['Decimal']['output'];
  /** Теоретическая цена опциона с учетом лимитов */
  theorPriceLimit: Scalars['Decimal']['output'];
  tradingDetails: TradingDetails;
  /** Валюта */
  underlyingCurrency?: Maybe<Scalars['String']['output']>;
  /** Волатильность */
  volatility: Scalars['Decimal']['output'];
}

export interface DerivativeFilterInput {
  additionalInformation?: InputMaybe<AdditionalInformationFilterInput>;
  and?: InputMaybe<Array<DerivativeFilterInput>>;
  basicInformation?: InputMaybe<BasicInformationFilterInput>;
  boardInformation?: InputMaybe<BoardInformationFilterInput>;
  currencyInformation?: InputMaybe<CurrencyInformationFilterInput>;
  financialAttributes?: InputMaybe<FinancialAttributesFilterInput>;
  /** Базовое ГО */
  initialMargin?: InputMaybe<InitialMarginFilterInput>;
  /** Цена маржинальной покупки (заемные средства) */
  marginBuy?: InputMaybe<DecimalOperationFilterInput>;
  /** Отношение цены маржинальной покупки к цене последней сделки */
  marginRate?: InputMaybe<DecimalOperationFilterInput>;
  /** Цена маржинальной продажи (заемные средства) */
  marginSell?: InputMaybe<DecimalOperationFilterInput>;
  or?: InputMaybe<Array<DerivativeFilterInput>>;
  /** Теоретическая цена опциона */
  theorPrice?: InputMaybe<DecimalOperationFilterInput>;
  /** Теоретическая цена опциона с учетом лимитов */
  theorPriceLimit?: InputMaybe<DecimalOperationFilterInput>;
  tradingDetails?: InputMaybe<TradingDetailsFilterInput>;
  /** Валюта */
  underlyingCurrency?: InputMaybe<StringOperationFilterInput>;
  /** Волатильность */
  volatility?: InputMaybe<DecimalOperationFilterInput>;
}

export interface DerivativeSortInput {
  additionalInformation?: InputMaybe<AdditionalInformationSortInput>;
  basicInformation?: InputMaybe<BasicInformationSortInput>;
  boardInformation?: InputMaybe<BoardInformationSortInput>;
  currencyInformation?: InputMaybe<CurrencyInformationSortInput>;
  financialAttributes?: InputMaybe<FinancialAttributesSortInput>;
  /** Базовое ГО */
  initialMargin?: InputMaybe<InitialMarginSortInput>;
  /** Цена маржинальной покупки (заемные средства) */
  marginBuy?: InputMaybe<SortEnumType>;
  /** Отношение цены маржинальной покупки к цене последней сделки */
  marginRate?: InputMaybe<SortEnumType>;
  /** Цена маржинальной продажи (заемные средства) */
  marginSell?: InputMaybe<SortEnumType>;
  /** Теоретическая цена опциона */
  theorPrice?: InputMaybe<SortEnumType>;
  /** Теоретическая цена опциона с учетом лимитов */
  theorPriceLimit?: InputMaybe<SortEnumType>;
  tradingDetails?: InputMaybe<TradingDetailsSortInput>;
  /** Валюта */
  underlyingCurrency?: InputMaybe<SortEnumType>;
  /** Волатильность */
  volatility?: InputMaybe<SortEnumType>;
}

/** A connection to a list of items. */
export interface DerivativesConnection {
  /** A list of edges. */
  edges?: Maybe<Array<DerivativesEdge>>;
  /** A flattened list of the nodes. */
  nodes?: Maybe<Array<Derivative>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  totalCount: Scalars['Int']['output'];
}

/** An edge in a connection. */
export interface DerivativesEdge {
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Derivative;
}

export interface Dividend {
  /** Валюта выплаты */
  currency?: Maybe<Scalars['String']['output']>;
  /** Планируемая дата окончания выплаты дивидендов */
  declaredPayDateNominee?: Maybe<Scalars['DateTime']['output']>;
  /** Выплата на одну акцию */
  dividendPerShare: Scalars['Decimal']['output'];
  /** Дивидендная доходность */
  dividendYield: Scalars['Decimal']['output'];
  /** Экс-дивидендная дата - дата, начиная с которой ценные бумаги начинают торговаться без учета объявленных дивидендов */
  exDividendDate?: Maybe<Scalars['DateTime']['output']>;
  /** Дата фиксации владельцев для участия в событии */
  fixDate?: Maybe<Scalars['DateTime']['output']>;
  /** Дата закрытия реестра */
  listDate?: Maybe<Scalars['DateTime']['output']>;
  /** Рекомендация совета директоров по выплате дивидендов на одну акцию */
  recommendDividendPerShare: Scalars['Decimal']['output'];
  /** Рекомендация совета директоров по дате фиксации владельцев для участия в событии */
  recommendFixDate?: Maybe<Scalars['DateTime']['output']>;
  /** Дата отсечки */
  recordDate: Scalars['DateTime']['output'];
}

export interface DividendFilterInput {
  and?: InputMaybe<Array<DividendFilterInput>>;
  /** Валюта выплаты */
  currency?: InputMaybe<StringOperationFilterInput>;
  /** Планируемая дата окончания выплаты дивидендов */
  declaredPayDateNominee?: InputMaybe<DateTimeOperationFilterInput>;
  /** Выплата на одну акцию */
  dividendPerShare?: InputMaybe<DecimalOperationFilterInput>;
  /** Дивидендная доходность */
  dividendYield?: InputMaybe<DecimalOperationFilterInput>;
  /** Экс-дивидендная дата - дата, начиная с которой ценные бумаги начинают торговаться без учета объявленных дивидендов */
  exDividendDate?: InputMaybe<DateTimeOperationFilterInput>;
  /** Дата фиксации владельцев для участия в событии */
  fixDate?: InputMaybe<DateTimeOperationFilterInput>;
  /** Дата закрытия реестра */
  listDate?: InputMaybe<DateTimeOperationFilterInput>;
  or?: InputMaybe<Array<DividendFilterInput>>;
  /** Рекомендация совета директоров по выплате дивидендов на одну акцию */
  recommendDividendPerShare?: InputMaybe<DecimalOperationFilterInput>;
  /** Рекомендация совета директоров по дате фиксации владельцев для участия в событии */
  recommendFixDate?: InputMaybe<DateTimeOperationFilterInput>;
  /** Дата отсечки */
  recordDate?: InputMaybe<DateTimeOperationFilterInput>;
}

export interface DividendSortInput {
  /** Валюта выплаты */
  currency?: InputMaybe<SortEnumType>;
  /** Планируемая дата окончания выплаты дивидендов */
  declaredPayDateNominee?: InputMaybe<SortEnumType>;
  /** Выплата на одну акцию */
  dividendPerShare?: InputMaybe<SortEnumType>;
  /** Дивидендная доходность */
  dividendYield?: InputMaybe<SortEnumType>;
  /** Экс-дивидендная дата - дата, начиная с которой ценные бумаги начинают торговаться без учета объявленных дивидендов */
  exDividendDate?: InputMaybe<SortEnumType>;
  /** Дата фиксации владельцев для участия в событии */
  fixDate?: InputMaybe<SortEnumType>;
  /** Дата закрытия реестра */
  listDate?: InputMaybe<SortEnumType>;
  /** Рекомендация совета директоров по выплате дивидендов на одну акцию */
  recommendDividendPerShare?: InputMaybe<SortEnumType>;
  /** Рекомендация совета директоров по дате фиксации владельцев для участия в событии */
  recommendFixDate?: InputMaybe<SortEnumType>;
  /** Дата отсечки */
  recordDate?: InputMaybe<SortEnumType>;
}

export interface DividendsAggregateInfo {
  /** Средняя дивидендная доходность за пять лет */
  averageDividendFor5years: Scalars['Decimal']['output'];
  /** Коэффициент выплаты дивидендов */
  payoutRatio: Scalars['Decimal']['output'];
}

export interface DividendsAggregateInfoFilterInput {
  and?: InputMaybe<Array<DividendsAggregateInfoFilterInput>>;
  /** Средняя дивидендная доходность за пять лет */
  averageDividendFor5years?: InputMaybe<DecimalOperationFilterInput>;
  or?: InputMaybe<Array<DividendsAggregateInfoFilterInput>>;
  /** Коэффициент выплаты дивидендов */
  payoutRatio?: InputMaybe<DecimalOperationFilterInput>;
}

export interface DividendsAggregateInfoSortInput {
  /** Средняя дивидендная доходность за пять лет */
  averageDividendFor5years?: InputMaybe<SortEnumType>;
  /** Коэффициент выплаты дивидендов */
  payoutRatio?: InputMaybe<SortEnumType>;
}

export enum Exchange {
  Be = 'BE',
  Imex = 'IMEX',
  Info = 'INFO',
  Its = 'ITS',
  Marex = 'MAREX',
  Moex = 'MOEX',
  None = 'NONE',
  Spbx = 'SPBX',
  Terex = 'TEREX',
  United = 'UNITED'
}

export interface ExchangeOperationFilterInput {
  eq?: InputMaybe<Exchange>;
  in?: InputMaybe<Array<Exchange>>;
  neq?: InputMaybe<Exchange>;
  nin?: InputMaybe<Array<Exchange>>;
}

export interface FinancialAttributes {
  /** Тип ценной бумаги согласно стандарту ISO 10962 */
  cfiCode: Scalars['String']['output'];
  /** Валюта */
  currency?: Maybe<Scalars['String']['output']>;
  /** Идентификатор ценной бумаги согласно стандарту ISO 6166 */
  isin?: Maybe<Scalars['String']['output']>;
  /** Торговый статус инструмента */
  tradingStatus: Scalars['Int']['output'];
  /** Описание торгового статуса инструмента */
  tradingStatusInfo?: Maybe<Scalars['String']['output']>;
}

export interface FinancialAttributesFilterInput {
  and?: InputMaybe<Array<FinancialAttributesFilterInput>>;
  /** Тип ценной бумаги согласно стандарту ISO 10962 */
  cfiCode?: InputMaybe<StringOperationFilterInput>;
  /** Валюта */
  currency?: InputMaybe<StringOperationFilterInput>;
  /** Идентификатор ценной бумаги согласно стандарту ISO 6166 */
  isin?: InputMaybe<StringOperationFilterInput>;
  or?: InputMaybe<Array<FinancialAttributesFilterInput>>;
  /** Торговый статус инструмента */
  tradingStatus?: InputMaybe<IntOperationFilterInput>;
  /** Описание торгового статуса инструмента */
  tradingStatusInfo?: InputMaybe<StringOperationFilterInput>;
}

export interface FinancialAttributesSortInput {
  /** Тип ценной бумаги согласно стандарту ISO 10962 */
  cfiCode?: InputMaybe<SortEnumType>;
  /** Валюта */
  currency?: InputMaybe<SortEnumType>;
  /** Идентификатор ценной бумаги согласно стандарту ISO 6166 */
  isin?: InputMaybe<SortEnumType>;
  /** Торговый статус инструмента */
  tradingStatus?: InputMaybe<SortEnumType>;
  /** Описание торгового статуса инструмента */
  tradingStatusInfo?: InputMaybe<SortEnumType>;
}

export interface InitialMargin {
  /** Базовое ГО лонг (КПУР) */
  highRiskLong: Scalars['Decimal']['output'];
  /** Базовое ГО шорт (КПУР) */
  highRiskShort: Scalars['Decimal']['output'];
  /** Базовое ГО лонг (КНУР) */
  lowRiskLong: Scalars['Decimal']['output'];
  /** Базовое ГО шорт (КНУР) */
  lowRiskShort: Scalars['Decimal']['output'];
  /** Базовое ГО лонг (КОУР) */
  specialRiskLong: Scalars['Decimal']['output'];
  /** Базовое ГО шорт (КОУР) */
  specialRiskShort: Scalars['Decimal']['output'];
  /** Базовое ГО лонг (КСУР) */
  standardRiskLong: Scalars['Decimal']['output'];
  /** Базовое ГО шорт (КСУР) */
  standardRiskShort: Scalars['Decimal']['output'];
}

export interface InitialMarginFilterInput {
  and?: InputMaybe<Array<InitialMarginFilterInput>>;
  /** Базовое ГО лонг (КПУР) */
  highRiskLong?: InputMaybe<DecimalOperationFilterInput>;
  /** Базовое ГО шорт (КПУР) */
  highRiskShort?: InputMaybe<DecimalOperationFilterInput>;
  /** Базовое ГО лонг (КНУР) */
  lowRiskLong?: InputMaybe<DecimalOperationFilterInput>;
  /** Базовое ГО шорт (КНУР) */
  lowRiskShort?: InputMaybe<DecimalOperationFilterInput>;
  or?: InputMaybe<Array<InitialMarginFilterInput>>;
  /** Базовое ГО лонг (КОУР) */
  specialRiskLong?: InputMaybe<DecimalOperationFilterInput>;
  /** Базовое ГО шорт (КОУР) */
  specialRiskShort?: InputMaybe<DecimalOperationFilterInput>;
  /** Базовое ГО лонг (КСУР) */
  standardRiskLong?: InputMaybe<DecimalOperationFilterInput>;
  /** Базовое ГО шорт (КСУР) */
  standardRiskShort?: InputMaybe<DecimalOperationFilterInput>;
}

export interface InitialMarginSortInput {
  /** Базовое ГО лонг (КПУР) */
  highRiskLong?: InputMaybe<SortEnumType>;
  /** Базовое ГО шорт (КПУР) */
  highRiskShort?: InputMaybe<SortEnumType>;
  /** Базовое ГО лонг (КНУР) */
  lowRiskLong?: InputMaybe<SortEnumType>;
  /** Базовое ГО шорт (КНУР) */
  lowRiskShort?: InputMaybe<SortEnumType>;
  /** Базовое ГО лонг (КОУР) */
  specialRiskLong?: InputMaybe<SortEnumType>;
  /** Базовое ГО шорт (КОУР) */
  specialRiskShort?: InputMaybe<SortEnumType>;
  /** Базовое ГО лонг (КСУР) */
  standardRiskLong?: InputMaybe<SortEnumType>;
  /** Базовое ГО шорт (КСУР) */
  standardRiskShort?: InputMaybe<SortEnumType>;
}

export interface Instrument {
  additionalInformation: AdditionalInformation;
  basicInformation: BasicInformation;
  boardInformation: BoardInformation;
  currencyInformation: CurrencyInformation;
  financialAttributes: FinancialAttributes;
  tradingDetails: TradingDetails;
}

export interface InstrumentModelFilterInput {
  additionalInformation?: InputMaybe<AdditionalInformationFilterInput>;
  and?: InputMaybe<Array<InstrumentModelFilterInput>>;
  basicInformation?: InputMaybe<BasicInformationFilterInput>;
  boardInformation?: InputMaybe<BoardInformationFilterInput>;
  currencyInformation?: InputMaybe<CurrencyInformationFilterInput>;
  financialAttributes?: InputMaybe<FinancialAttributesFilterInput>;
  or?: InputMaybe<Array<InstrumentModelFilterInput>>;
  tradingDetails?: InputMaybe<TradingDetailsFilterInput>;
}

export interface InstrumentModelSortInput {
  additionalInformation?: InputMaybe<AdditionalInformationSortInput>;
  basicInformation?: InputMaybe<BasicInformationSortInput>;
  boardInformation?: InputMaybe<BoardInformationSortInput>;
  currencyInformation?: InputMaybe<CurrencyInformationSortInput>;
  financialAttributes?: InputMaybe<FinancialAttributesSortInput>;
  tradingDetails?: InputMaybe<TradingDetailsSortInput>;
}

/** A connection to a list of items. */
export interface InstrumentsConnection {
  /** A list of edges. */
  edges?: Maybe<Array<InstrumentsEdge>>;
  /** A flattened list of the nodes. */
  nodes?: Maybe<Array<Instrument>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  totalCount: Scalars['Int']['output'];
}

/** An edge in a connection. */
export interface InstrumentsEdge {
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Instrument;
}

export interface IntOperationFilterInput {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  neq?: InputMaybe<Scalars['Int']['input']>;
  ngt?: InputMaybe<Scalars['Int']['input']>;
  ngte?: InputMaybe<Scalars['Int']['input']>;
  nin?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  nlt?: InputMaybe<Scalars['Int']['input']>;
  nlte?: InputMaybe<Scalars['Int']['input']>;
}

export interface ListFilterInputTypeOfAmortizationFilterInput {
  all?: InputMaybe<AmortizationFilterInput>;
  any?: InputMaybe<Scalars['Boolean']['input']>;
  none?: InputMaybe<AmortizationFilterInput>;
  some?: InputMaybe<AmortizationFilterInput>;
}

export interface ListFilterInputTypeOfCouponFilterInput {
  all?: InputMaybe<CouponFilterInput>;
  any?: InputMaybe<Scalars['Boolean']['input']>;
  none?: InputMaybe<CouponFilterInput>;
  some?: InputMaybe<CouponFilterInput>;
}

export interface ListFilterInputTypeOfDividendFilterInput {
  all?: InputMaybe<DividendFilterInput>;
  any?: InputMaybe<Scalars['Boolean']['input']>;
  none?: InputMaybe<DividendFilterInput>;
  some?: InputMaybe<DividendFilterInput>;
}

export interface ListFilterInputTypeOfOfferFilterInput {
  all?: InputMaybe<OfferFilterInput>;
  any?: InputMaybe<Scalars['Boolean']['input']>;
  none?: InputMaybe<OfferFilterInput>;
  some?: InputMaybe<OfferFilterInput>;
}

export interface ListFilterInputTypeOfValuePerQuarterFilterInput {
  all?: InputMaybe<ValuePerQuarterFilterInput>;
  any?: InputMaybe<Scalars['Boolean']['input']>;
  none?: InputMaybe<ValuePerQuarterFilterInput>;
  some?: InputMaybe<ValuePerQuarterFilterInput>;
}

export interface ListFilterInputTypeOfValuePerYearFilterInput {
  all?: InputMaybe<ValuePerYearFilterInput>;
  any?: InputMaybe<Scalars['Boolean']['input']>;
  none?: InputMaybe<ValuePerYearFilterInput>;
  some?: InputMaybe<ValuePerYearFilterInput>;
}

export interface LongOperationFilterInput {
  eq?: InputMaybe<Scalars['Long']['input']>;
  gt?: InputMaybe<Scalars['Long']['input']>;
  gte?: InputMaybe<Scalars['Long']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  lt?: InputMaybe<Scalars['Long']['input']>;
  lte?: InputMaybe<Scalars['Long']['input']>;
  neq?: InputMaybe<Scalars['Long']['input']>;
  ngt?: InputMaybe<Scalars['Long']['input']>;
  ngte?: InputMaybe<Scalars['Long']['input']>;
  nin?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  nlt?: InputMaybe<Scalars['Long']['input']>;
  nlte?: InputMaybe<Scalars['Long']['input']>;
}

export interface MainIndicators {
  /** Прибыль до вычета процентов, налогов, износа и амортизации */
  ebitda: Scalars['Long']['output'];
  /** Капитализация компании */
  marketCap: Scalars['Long']['output'];
}

export interface MainIndicatorsFilterInput {
  and?: InputMaybe<Array<MainIndicatorsFilterInput>>;
  /** Прибыль до вычета процентов, налогов, износа и амортизации */
  ebitda?: InputMaybe<LongOperationFilterInput>;
  /** Капитализация компании */
  marketCap?: InputMaybe<LongOperationFilterInput>;
  or?: InputMaybe<Array<MainIndicatorsFilterInput>>;
}

export interface MainIndicatorsSortInput {
  /** Прибыль до вычета процентов, налогов, износа и амортизации */
  ebitda?: InputMaybe<SortEnumType>;
  /** Капитализация компании */
  marketCap?: InputMaybe<SortEnumType>;
}

export enum Market {
  Be = 'BE',
  Curr = 'CURR',
  Fond = 'FOND',
  Forts = 'FORTS',
  Imex = 'IMEX',
  Info = 'INFO',
  Its = 'ITS',
  Marex = 'MAREX',
  Spbx = 'SPBX',
  Terex = 'TEREX',
  United = 'UNITED'
}

export interface MarketOperationFilterInput {
  eq?: InputMaybe<Market>;
  in?: InputMaybe<Array<Market>>;
  neq?: InputMaybe<Market>;
  nin?: InputMaybe<Array<Market>>;
}

export interface NetIncome {
  /** Данные за год */
  year?: Maybe<Array<ValuePerYear>>;
}

export interface NetIncomeFilterInput {
  and?: InputMaybe<Array<NetIncomeFilterInput>>;
  or?: InputMaybe<Array<NetIncomeFilterInput>>;
  /** Данные за год */
  year?: InputMaybe<ListFilterInputTypeOfValuePerYearFilterInput>;
}

export interface NullableOfCouponTypeOperationFilterInput {
  eq?: InputMaybe<CouponType>;
  in?: InputMaybe<Array<InputMaybe<CouponType>>>;
  neq?: InputMaybe<CouponType>;
  nin?: InputMaybe<Array<InputMaybe<CouponType>>>;
}

export interface Offer {
  /** Выплата на одну облигацию */
  amount: Scalars['Decimal']['output'];
  /** Начало периода предъявления к выкупу */
  begOrder?: Maybe<Scalars['DateTime']['output']>;
  /** Тип события (CALL, PUT) */
  bondEventType: BondEventType;
  /** Валюта выплаты */
  currency?: Maybe<Scalars['String']['output']>;
  /** Дата события */
  date: Scalars['DateTime']['output'];
  /** Описание (безотзывная оферта, Call-опцион и т.д.) */
  description?: Maybe<Scalars['String']['output']>;
  /** Окончание периода предъявления к выкупу */
  endOrder?: Maybe<Scalars['DateTime']['output']>;
  /** Дата фиксации владельцев для участия в событии */
  fixDate?: Maybe<Scalars['DateTime']['output']>;
  /** Признак наличия ближайшего события */
  isClosest: Scalars['Boolean']['output'];
  /** Ставка купона, доля номинала, цена выкупа или коэффициент конвертации */
  value?: Maybe<Scalars['Decimal']['output']>;
}

export interface OfferFilterInput {
  /** Выплата на одну облигацию */
  amount?: InputMaybe<DecimalOperationFilterInput>;
  and?: InputMaybe<Array<OfferFilterInput>>;
  /** Начало периода предъявления к выкупу */
  begOrder?: InputMaybe<DateTimeOperationFilterInput>;
  /** Тип события (CALL, PUT) */
  bondEventType?: InputMaybe<BondEventTypeOperationFilterInput>;
  /** Валюта выплаты */
  currency?: InputMaybe<StringOperationFilterInput>;
  /** Дата события */
  date?: InputMaybe<DateTimeOperationFilterInput>;
  /** Описание (безотзывная оферта, Call-опцион и т.д.) */
  description?: InputMaybe<StringOperationFilterInput>;
  /** Окончание периода предъявления к выкупу */
  endOrder?: InputMaybe<DateTimeOperationFilterInput>;
  /** Дата фиксации владельцев для участия в событии */
  fixDate?: InputMaybe<DateTimeOperationFilterInput>;
  /** Признак наличия ближайшего события */
  isClosest?: InputMaybe<BooleanOperationFilterInput>;
  or?: InputMaybe<Array<OfferFilterInput>>;
  /** Ставка купона, доля номинала, цена выкупа или коэффициент конвертации */
  value?: InputMaybe<DecimalOperationFilterInput>;
}

export interface OfferSortInput {
  /** Выплата на одну облигацию */
  amount?: InputMaybe<SortEnumType>;
  /** Начало периода предъявления к выкупу */
  begOrder?: InputMaybe<SortEnumType>;
  /** Тип события (CALL, PUT) */
  bondEventType?: InputMaybe<SortEnumType>;
  /** Валюта выплаты */
  currency?: InputMaybe<SortEnumType>;
  /** Дата события */
  date?: InputMaybe<SortEnumType>;
  /** Описание (безотзывная оферта, Call-опцион и т.д.) */
  description?: InputMaybe<SortEnumType>;
  /** Окончание периода предъявления к выкупу */
  endOrder?: InputMaybe<SortEnumType>;
  /** Дата фиксации владельцев для участия в событии */
  fixDate?: InputMaybe<SortEnumType>;
  /** Признак наличия ближайшего события */
  isClosest?: InputMaybe<SortEnumType>;
  /** Ставка купона, доля номинала, цена выкупа или коэффициент конвертации */
  value?: InputMaybe<SortEnumType>;
}

export interface Other extends Instrument {
  additionalInformation: AdditionalInformation;
  basicInformation: BasicInformation;
  boardInformation: BoardInformation;
  currencyInformation: CurrencyInformation;
  financialAttributes: FinancialAttributes;
  tradingDetails: TradingDetails;
}

/** Information about pagination in a connection. */
export interface PageInfo {
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** Indicates whether more edges exist following the set defined by the clients arguments. */
  hasNextPage: Scalars['Boolean']['output'];
  /** Indicates whether more edges exist prior the set defined by the clients arguments. */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']['output']>;
}

export interface Profitability {
  /** Долговая нагрузка компании по сравнению с ее собственным капиталом */
  debtPerEquity: Scalars['Decimal']['output'];
  /** Коэффициент рентабельности активов (отношение чистой прибыли к величине всех активов) */
  returnOnAssets: Scalars['Decimal']['output'];
  /** Коэффициент рентабельности собственного капитала (отношение чистой прибыли компании к капиталу компании) */
  returnOnEquity: Scalars['Decimal']['output'];
}

export interface ProfitabilityFilterInput {
  and?: InputMaybe<Array<ProfitabilityFilterInput>>;
  /** Долговая нагрузка компании по сравнению с ее собственным капиталом */
  debtPerEquity?: InputMaybe<DecimalOperationFilterInput>;
  or?: InputMaybe<Array<ProfitabilityFilterInput>>;
  /** Коэффициент рентабельности активов (отношение чистой прибыли к величине всех активов) */
  returnOnAssets?: InputMaybe<DecimalOperationFilterInput>;
  /** Коэффициент рентабельности собственного капитала (отношение чистой прибыли компании к капиталу компании) */
  returnOnEquity?: InputMaybe<DecimalOperationFilterInput>;
}

export interface ProfitabilitySortInput {
  /** Долговая нагрузка компании по сравнению с ее собственным капиталом */
  debtPerEquity?: InputMaybe<SortEnumType>;
  /** Коэффициент рентабельности активов (отношение чистой прибыли к величине всех активов) */
  returnOnAssets?: InputMaybe<SortEnumType>;
  /** Коэффициент рентабельности собственного капитала (отношение чистой прибыли компании к капиталу компании) */
  returnOnEquity?: InputMaybe<SortEnumType>;
}

export interface Query {
  bond?: Maybe<Bond>;
  bonds?: Maybe<BondsConnection>;
  currencies?: Maybe<CurrenciesConnection>;
  currency?: Maybe<Currency>;
  derivative?: Maybe<Derivative>;
  derivatives?: Maybe<DerivativesConnection>;
  instrument?: Maybe<Instrument>;
  instruments?: Maybe<InstrumentsConnection>;
  stock?: Maybe<Stock>;
  stocks?: Maybe<StocksConnection>;
  swap?: Maybe<Swap>;
  swaps?: Maybe<SwapsConnection>;
}


export interface QueryBondArgs {
  board: Scalars['String']['input'];
  exchange: Scalars['String']['input'];
  symbol: Scalars['String']['input'];
}


export interface QueryBondsArgs {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includeNonBaseBoards?: Scalars['Boolean']['input'];
  includeOld?: Scalars['Boolean']['input'];
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Array<BondSortInput>>;
  where?: InputMaybe<BondFilterInput>;
}


export interface QueryCurrenciesArgs {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includeNonBaseBoards?: Scalars['Boolean']['input'];
  includeOld?: Scalars['Boolean']['input'];
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Array<CurrencySortInput>>;
  where?: InputMaybe<CurrencyFilterInput>;
}


export interface QueryCurrencyArgs {
  board: Scalars['String']['input'];
  exchange: Scalars['String']['input'];
  symbol: Scalars['String']['input'];
}


export interface QueryDerivativeArgs {
  board: Scalars['String']['input'];
  exchange: Scalars['String']['input'];
  symbol: Scalars['String']['input'];
}


export interface QueryDerivativesArgs {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includeNonBaseBoards?: Scalars['Boolean']['input'];
  includeOld?: Scalars['Boolean']['input'];
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Array<DerivativeSortInput>>;
  where?: InputMaybe<DerivativeFilterInput>;
}


export interface QueryInstrumentArgs {
  board: Scalars['String']['input'];
  exchange: Scalars['String']['input'];
  symbol: Scalars['String']['input'];
}


export interface QueryInstrumentsArgs {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includeNonBaseBoards?: Scalars['Boolean']['input'];
  includeOld?: Scalars['Boolean']['input'];
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Array<InstrumentModelSortInput>>;
  where?: InputMaybe<InstrumentModelFilterInput>;
}


export interface QueryStockArgs {
  board: Scalars['String']['input'];
  exchange: Scalars['String']['input'];
  symbol: Scalars['String']['input'];
}


export interface QueryStocksArgs {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includeNonBaseBoards?: Scalars['Boolean']['input'];
  includeOld?: Scalars['Boolean']['input'];
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Array<StockSortInput>>;
  where?: InputMaybe<StockFilterInput>;
}


export interface QuerySwapArgs {
  board: Scalars['String']['input'];
  exchange: Scalars['String']['input'];
  symbol: Scalars['String']['input'];
}


export interface QuerySwapsArgs {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includeNonBaseBoards?: Scalars['Boolean']['input'];
  includeOld?: Scalars['Boolean']['input'];
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Array<SwapSortInput>>;
  where?: InputMaybe<SwapFilterInput>;
}

export interface Sales {
  /** Данные за квартал */
  quarter?: Maybe<Array<ValuePerQuarter>>;
  /** Данные за год */
  year?: Maybe<Array<ValuePerYear>>;
}

export interface SalesFilterInput {
  and?: InputMaybe<Array<SalesFilterInput>>;
  or?: InputMaybe<Array<SalesFilterInput>>;
  /** Данные за квартал */
  quarter?: InputMaybe<ListFilterInputTypeOfValuePerQuarterFilterInput>;
  /** Данные за год */
  year?: InputMaybe<ListFilterInputTypeOfValuePerYearFilterInput>;
}

export enum SortEnumType {
  Asc = 'ASC',
  Desc = 'DESC'
}

export interface Stock extends Instrument {
  additionalInformation: AdditionalInformation;
  basicInformation: BasicInformation;
  boardInformation: BoardInformation;
  /** Данные об оценке стоимости компании */
  costEstimate?: Maybe<CostEstimate>;
  currencyInformation: CurrencyInformation;
  /** Данные о выплате дивидендов (если инструмент является акцией) */
  dividends?: Maybe<Array<Dividend>>;
  /** Данные о выплате дивидендов компанией */
  dividendsAggregateInfo?: Maybe<DividendsAggregateInfo>;
  financialAttributes: FinancialAttributes;
  /** Основные показатели компании */
  mainIndicators?: Maybe<MainIndicators>;
  /** Данные о чистой прибыли компании */
  netIncome?: Maybe<NetIncome>;
  /** Данные о доходности компании */
  profitability?: Maybe<Profitability>;
  /** Данные о выручке компании */
  sales?: Maybe<Sales>;
  /** Торговые данные компании */
  trading?: Maybe<Trading>;
  tradingDetails: TradingDetails;
}


export interface StockDividendsArgs {
  order?: InputMaybe<Array<DividendSortInput>>;
  where?: InputMaybe<DividendFilterInput>;
}

export interface StockFilterInput {
  additionalInformation?: InputMaybe<AdditionalInformationFilterInput>;
  and?: InputMaybe<Array<StockFilterInput>>;
  basicInformation?: InputMaybe<BasicInformationFilterInput>;
  boardInformation?: InputMaybe<BoardInformationFilterInput>;
  /** Данные об оценке стоимости компании */
  costEstimate?: InputMaybe<CostEstimateFilterInput>;
  currencyInformation?: InputMaybe<CurrencyInformationFilterInput>;
  /** Данные о выплате дивидендов (если инструмент является акцией) */
  dividends?: InputMaybe<ListFilterInputTypeOfDividendFilterInput>;
  /** Данные о выплате дивидендов компанией */
  dividendsAggregateInfo?: InputMaybe<DividendsAggregateInfoFilterInput>;
  financialAttributes?: InputMaybe<FinancialAttributesFilterInput>;
  /** Основные показатели компании */
  mainIndicators?: InputMaybe<MainIndicatorsFilterInput>;
  /** Данные о чистой прибыли компании */
  netIncome?: InputMaybe<NetIncomeFilterInput>;
  or?: InputMaybe<Array<StockFilterInput>>;
  /** Данные о доходности компании */
  profitability?: InputMaybe<ProfitabilityFilterInput>;
  /** Данные о выручке компании */
  sales?: InputMaybe<SalesFilterInput>;
  /** Торговые данные компании */
  trading?: InputMaybe<TradingFilterInput>;
  tradingDetails?: InputMaybe<TradingDetailsFilterInput>;
}

export interface StockSortInput {
  additionalInformation?: InputMaybe<AdditionalInformationSortInput>;
  basicInformation?: InputMaybe<BasicInformationSortInput>;
  boardInformation?: InputMaybe<BoardInformationSortInput>;
  /** Данные об оценке стоимости компании */
  costEstimate?: InputMaybe<CostEstimateSortInput>;
  currencyInformation?: InputMaybe<CurrencyInformationSortInput>;
  /** Данные о выплате дивидендов компанией */
  dividendsAggregateInfo?: InputMaybe<DividendsAggregateInfoSortInput>;
  financialAttributes?: InputMaybe<FinancialAttributesSortInput>;
  /** Основные показатели компании */
  mainIndicators?: InputMaybe<MainIndicatorsSortInput>;
  /** Данные о доходности компании */
  profitability?: InputMaybe<ProfitabilitySortInput>;
  /** Торговые данные компании */
  trading?: InputMaybe<TradingSortInput>;
  tradingDetails?: InputMaybe<TradingDetailsSortInput>;
}

/** A connection to a list of items. */
export interface StocksConnection {
  /** A list of edges. */
  edges?: Maybe<Array<StocksEdge>>;
  /** A flattened list of the nodes. */
  nodes?: Maybe<Array<Stock>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  totalCount: Scalars['Int']['output'];
}

/** An edge in a connection. */
export interface StocksEdge {
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Stock;
}

export interface StringOperationFilterInput {
  and?: InputMaybe<Array<StringOperationFilterInput>>;
  contains?: InputMaybe<Scalars['String']['input']>;
  endsWith?: InputMaybe<Scalars['String']['input']>;
  eq?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  ncontains?: InputMaybe<Scalars['String']['input']>;
  nendsWith?: InputMaybe<Scalars['String']['input']>;
  neq?: InputMaybe<Scalars['String']['input']>;
  nin?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  nstartsWith?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<StringOperationFilterInput>>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
}

export interface Swap extends Instrument {
  additionalInformation: AdditionalInformation;
  /** Базовый курс при торговле СВОП инструментом. */
  baseSwapPrice: Scalars['Decimal']['output'];
  basicInformation: BasicInformation;
  boardInformation: BoardInformation;
  currencyInformation: CurrencyInformation;
  financialAttributes: FinancialAttributes;
  tradingDetails: TradingDetails;
}

export interface SwapFilterInput {
  additionalInformation?: InputMaybe<AdditionalInformationFilterInput>;
  and?: InputMaybe<Array<SwapFilterInput>>;
  /** Базовый курс при торговле СВОП инструментом. */
  baseSwapPrice?: InputMaybe<DecimalOperationFilterInput>;
  basicInformation?: InputMaybe<BasicInformationFilterInput>;
  boardInformation?: InputMaybe<BoardInformationFilterInput>;
  currencyInformation?: InputMaybe<CurrencyInformationFilterInput>;
  financialAttributes?: InputMaybe<FinancialAttributesFilterInput>;
  or?: InputMaybe<Array<SwapFilterInput>>;
  tradingDetails?: InputMaybe<TradingDetailsFilterInput>;
}

export interface SwapSortInput {
  additionalInformation?: InputMaybe<AdditionalInformationSortInput>;
  /** Базовый курс при торговле СВОП инструментом. */
  baseSwapPrice?: InputMaybe<SortEnumType>;
  basicInformation?: InputMaybe<BasicInformationSortInput>;
  boardInformation?: InputMaybe<BoardInformationSortInput>;
  currencyInformation?: InputMaybe<CurrencyInformationSortInput>;
  financialAttributes?: InputMaybe<FinancialAttributesSortInput>;
  tradingDetails?: InputMaybe<TradingDetailsSortInput>;
}

/** A connection to a list of items. */
export interface SwapsConnection {
  /** A list of edges. */
  edges?: Maybe<Array<SwapsEdge>>;
  /** A flattened list of the nodes. */
  nodes?: Maybe<Array<Swap>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  totalCount: Scalars['Int']['output'];
}

/** An edge in a connection. */
export interface SwapsEdge {
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Swap;
}

export interface Trading {
  /** Средний оборот за день */
  averageTurnoverPerDay: Scalars['Long']['output'];
  /** Средний оборот за месяц */
  averageTurnoverPerMonth: Scalars['Long']['output'];
  /** Цена закрытия */
  closePrice: Scalars['Decimal']['output'];
  /** Максимальная цена актива за 52 недели */
  maxFor52Weeks: Scalars['Decimal']['output'];
  /** Минимальная цена актива за 52 недели */
  minFor52Weeks: Scalars['Decimal']['output'];
}

export interface TradingDetails {
  /** Капитализации */
  capitalization: Scalars['Decimal']['output'];
  /** Цена закрытия */
  closingPrice: Scalars['Decimal']['output'];
  /** Дневной рост */
  dailyGrowth: Scalars['Decimal']['output'];
  /** Дневной рост, % */
  dailyGrowthPercent: Scalars['Decimal']['output'];
  /** Размер лота */
  lotSize: Scalars['Decimal']['output'];
  /** Минимальный шаг цены */
  minStep: Scalars['Decimal']['output'];
  /** Последняя цена */
  price: Scalars['Decimal']['output'];
  /** Максимальная цена */
  priceMax: Scalars['Decimal']['output'];
  /** Минимальная цена */
  priceMin: Scalars['Decimal']['output'];
  /** Минимальный шаг цены, выраженный в рублях */
  priceStep: Scalars['Decimal']['output'];
  /** Рейтинг */
  rating: Scalars['Decimal']['output'];
  /** Объем торгов в базовой валюте */
  tradeAmount: Scalars['Decimal']['output'];
  /** Объем */
  tradeVolume: Scalars['Decimal']['output'];
}

export interface TradingDetailsFilterInput {
  and?: InputMaybe<Array<TradingDetailsFilterInput>>;
  /** Капитализации */
  capitalization?: InputMaybe<DecimalOperationFilterInput>;
  /** Цена закрытия */
  closingPrice?: InputMaybe<DecimalOperationFilterInput>;
  /** Дневной рост */
  dailyGrowth?: InputMaybe<DecimalOperationFilterInput>;
  /** Дневной рост, % */
  dailyGrowthPercent?: InputMaybe<DecimalOperationFilterInput>;
  /** Размер лота */
  lotSize?: InputMaybe<DecimalOperationFilterInput>;
  /** Минимальный шаг цены */
  minStep?: InputMaybe<DecimalOperationFilterInput>;
  or?: InputMaybe<Array<TradingDetailsFilterInput>>;
  /** Последняя цена */
  price?: InputMaybe<DecimalOperationFilterInput>;
  /** Максимальная цена */
  priceMax?: InputMaybe<DecimalOperationFilterInput>;
  /** Минимальная цена */
  priceMin?: InputMaybe<DecimalOperationFilterInput>;
  /** Минимальный шаг цены, выраженный в рублях */
  priceStep?: InputMaybe<DecimalOperationFilterInput>;
  /** Рейтинг */
  rating?: InputMaybe<DecimalOperationFilterInput>;
  /** Объем торгов в базовой валюте */
  tradeAmount?: InputMaybe<DecimalOperationFilterInput>;
  /** Объем */
  tradeVolume?: InputMaybe<DecimalOperationFilterInput>;
}

export interface TradingDetailsSortInput {
  /** Капитализации */
  capitalization?: InputMaybe<SortEnumType>;
  /** Цена закрытия */
  closingPrice?: InputMaybe<SortEnumType>;
  /** Дневной рост */
  dailyGrowth?: InputMaybe<SortEnumType>;
  /** Дневной рост, % */
  dailyGrowthPercent?: InputMaybe<SortEnumType>;
  /** Размер лота */
  lotSize?: InputMaybe<SortEnumType>;
  /** Минимальный шаг цены */
  minStep?: InputMaybe<SortEnumType>;
  /** Последняя цена */
  price?: InputMaybe<SortEnumType>;
  /** Максимальная цена */
  priceMax?: InputMaybe<SortEnumType>;
  /** Минимальная цена */
  priceMin?: InputMaybe<SortEnumType>;
  /** Минимальный шаг цены, выраженный в рублях */
  priceStep?: InputMaybe<SortEnumType>;
  /** Рейтинг */
  rating?: InputMaybe<SortEnumType>;
  /** Объем торгов в базовой валюте */
  tradeAmount?: InputMaybe<SortEnumType>;
  /** Объем */
  tradeVolume?: InputMaybe<SortEnumType>;
}

export interface TradingFilterInput {
  and?: InputMaybe<Array<TradingFilterInput>>;
  /** Средний оборот за день */
  averageTurnoverPerDay?: InputMaybe<LongOperationFilterInput>;
  /** Средний оборот за месяц */
  averageTurnoverPerMonth?: InputMaybe<LongOperationFilterInput>;
  /** Цена закрытия */
  closePrice?: InputMaybe<DecimalOperationFilterInput>;
  /** Максимальная цена актива за 52 недели */
  maxFor52Weeks?: InputMaybe<DecimalOperationFilterInput>;
  /** Минимальная цена актива за 52 недели */
  minFor52Weeks?: InputMaybe<DecimalOperationFilterInput>;
  or?: InputMaybe<Array<TradingFilterInput>>;
}

export interface TradingSortInput {
  /** Средний оборот за день */
  averageTurnoverPerDay?: InputMaybe<SortEnumType>;
  /** Средний оборот за месяц */
  averageTurnoverPerMonth?: InputMaybe<SortEnumType>;
  /** Цена закрытия */
  closePrice?: InputMaybe<SortEnumType>;
  /** Максимальная цена актива за 52 недели */
  maxFor52Weeks?: InputMaybe<SortEnumType>;
  /** Минимальная цена актива за 52 недели */
  minFor52Weeks?: InputMaybe<SortEnumType>;
}

export interface ValuePerQuarter {
  /** Порядковый номер квартала */
  quarter: Scalars['Int']['output'];
  /** Объем финансового показателя */
  value: Scalars['Long']['output'];
  /** Год */
  year: Scalars['Int']['output'];
}

export interface ValuePerQuarterFilterInput {
  and?: InputMaybe<Array<ValuePerQuarterFilterInput>>;
  or?: InputMaybe<Array<ValuePerQuarterFilterInput>>;
  /** Порядковый номер квартала */
  quarter?: InputMaybe<IntOperationFilterInput>;
  /** Объем финансового показателя */
  value?: InputMaybe<LongOperationFilterInput>;
  /** Год */
  year?: InputMaybe<IntOperationFilterInput>;
}

export interface ValuePerYear {
  /** Объем финансового показателя */
  value: Scalars['Long']['output'];
  /** Год */
  year: Scalars['Int']['output'];
}

export interface ValuePerYearFilterInput {
  and?: InputMaybe<Array<ValuePerYearFilterInput>>;
  or?: InputMaybe<Array<ValuePerYearFilterInput>>;
  /** Объем финансового показателя */
  value?: InputMaybe<LongOperationFilterInput>;
  /** Год */
  year?: InputMaybe<IntOperationFilterInput>;
}
