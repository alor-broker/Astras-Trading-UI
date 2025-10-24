/* eslint-disable */
import { z } from 'zod/v3'
import { AdditionalInformation, AdditionalInformationFilterInput, AdditionalInformationSortInput, Amortization, AmortizationFilterInput, AmortizationSortInput, ApplyPolicy, BasicInformation, BasicInformationFilterInput, BasicInformationSortInput, BoardInformation, BoardInformationFilterInput, BoardInformationSortInput, Bond, BondAmortizationsArgs, BondCouponsArgs, BondOffersArgs, BondEventType, BondEventTypeOperationFilterInput, BondFilterInput, BondSortInput, BondVolumes, BondVolumesFilterInput, BondVolumesSortInput, BondYield, BondYieldFilterInput, BondYieldSortInput, BondsConnection, BondsEdge, BooleanOperationFilterInput, CostEstimate, CostEstimateFilterInput, CostEstimateSortInput, Coupon, CouponFilterInput, CouponSortInput, CouponType, CouponTypeOperationFilterInput, CurrenciesConnection, CurrenciesEdge, Currency, CurrencyFilterInput, CurrencyInformation, CurrencyInformationFilterInput, CurrencyInformationSortInput, CurrencySortInput, DateTimeOperationFilterInput, DecimalOperationFilterInput, Derivative, DerivativeFilterInput, DerivativeSortInput, DerivativesConnection, DerivativesEdge, Dividend, DividendFilterInput, DividendSortInput, DividendsAggregateInfo, DividendsAggregateInfoFilterInput, DividendsAggregateInfoSortInput, Exchange, ExchangeOperationFilterInput, FinancialAttributes, FinancialAttributesFilterInput, FinancialAttributesSortInput, InitialMargin, InitialMarginFilterInput, InitialMarginSortInput, Instrument, InstrumentModelFilterInput, InstrumentModelSortInput, InstrumentsConnection, InstrumentsEdge, IntOperationFilterInput, ListFilterInputTypeOfAmortizationFilterInput, ListFilterInputTypeOfCouponFilterInput, ListFilterInputTypeOfDividendFilterInput, ListFilterInputTypeOfOfferFilterInput, ListFilterInputTypeOfValuePerQuarterFilterInput, ListFilterInputTypeOfValuePerYearFilterInput, LongOperationFilterInput, MainIndicators, MainIndicatorsFilterInput, MainIndicatorsSortInput, Market, MarketOperationFilterInput, NetIncome, NetIncomeFilterInput, NullableOfCouponTypeOperationFilterInput, Offer, OfferFilterInput, OfferSortInput, Other, PageInfo, Profitability, ProfitabilityFilterInput, ProfitabilitySortInput, Sales, SalesFilterInput, SortEnumType, Stock, StockDividendsArgs, StockFilterInput, StockSortInput, StocksConnection, StocksEdge, StringOperationFilterInput, Swap, SwapFilterInput, SwapSortInput, SwapsConnection, SwapsEdge, Trading, TradingDetails, TradingDetailsFilterInput, TradingDetailsSortInput, TradingFilterInput, TradingSortInput, ValuePerQuarter, ValuePerQuarterFilterInput, ValuePerYear, ValuePerYearFilterInput } from './graphql.types'

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K], any, T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny => v !== undefined && v !== null;

export const definedNonNullAnySchema = z.any().refine((v) => isDefinedNonNullAny(v));

export const ApplyPolicySchema = z.nativeEnum(ApplyPolicy);

export const BondEventTypeSchema = z.nativeEnum(BondEventType);

export const CouponTypeSchema = z.nativeEnum(CouponType);

export const ExchangeSchema = z.nativeEnum(Exchange);

export const MarketSchema = z.nativeEnum(Market);

export const SortEnumTypeSchema = z.nativeEnum(SortEnumType);

export function AdditionalInformationSchema(): z.ZodObject<Properties<AdditionalInformation>> {
  return z.object({
    __typename: z.literal('AdditionalInformation').optional(),
    cancellation: z.string(),
    complexProductCategory: z.string().nullish(),
    priceMultiplier: z.number(),
    priceShownUnits: z.number()
  })
}

export function AdditionalInformationFilterInputSchema(): z.ZodObject<Properties<AdditionalInformationFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => AdditionalInformationFilterInputSchema())).nullish(),
    cancellation: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    complexProductCategory: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => AdditionalInformationFilterInputSchema())).nullish(),
    priceMultiplier: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    priceShownUnits: z.lazy(() => DecimalOperationFilterInputSchema().nullish())
  })
}

export function AdditionalInformationSortInputSchema(): z.ZodObject<Properties<AdditionalInformationSortInput>> {
  return z.object({
    cancellation: SortEnumTypeSchema.nullish(),
    complexProductCategory: SortEnumTypeSchema.nullish(),
    priceMultiplier: SortEnumTypeSchema.nullish(),
    priceShownUnits: SortEnumTypeSchema.nullish()
  })
}

export function AmortizationSchema(): z.ZodObject<Properties<Amortization>> {
  return z.object({
    __typename: z.literal('Amortization').optional(),
    amount: z.number(),
    buyBackPrice: z.number().nullish(),
    currency: z.string().nullish(),
    date: z.string(),
    fixDate: z.string().nullish(),
    isClosest: z.boolean(),
    parFraction: z.number(),
    value: z.number().nullish()
  })
}

export function AmortizationFilterInputSchema(): z.ZodObject<Properties<AmortizationFilterInput>> {
  return z.object({
    amount: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => AmortizationFilterInputSchema())).nullish(),
    buyBackPrice: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    currency: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    date: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    fixDate: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    isClosest: z.lazy(() => BooleanOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => AmortizationFilterInputSchema())).nullish(),
    parFraction: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    value: z.lazy(() => DecimalOperationFilterInputSchema().nullish())
  })
}

export function AmortizationSortInputSchema(): z.ZodObject<Properties<AmortizationSortInput>> {
  return z.object({
    amount: SortEnumTypeSchema.nullish(),
    buyBackPrice: SortEnumTypeSchema.nullish(),
    currency: SortEnumTypeSchema.nullish(),
    date: SortEnumTypeSchema.nullish(),
    fixDate: SortEnumTypeSchema.nullish(),
    isClosest: SortEnumTypeSchema.nullish(),
    parFraction: SortEnumTypeSchema.nullish(),
    value: SortEnumTypeSchema.nullish()
  })
}

export function BasicInformationSchema(): z.ZodObject<Properties<BasicInformation>> {
  return z.object({
    __typename: z.literal('BasicInformation').optional(),
    complexProductCategory: z.string(),
    description: z.string(),
    exchange: ExchangeSchema,
    fullDescription: z.string(),
    fullName: z.string().nullish(),
    gicsSector: z.string().nullish(),
    market: MarketSchema,
    readableType: z.string().nullish(),
    sector: z.string().nullish(),
    shortName: z.string(),
    symbol: z.string(),
    type: z.string().nullish()
  })
}

export function BasicInformationFilterInputSchema(): z.ZodObject<Properties<BasicInformationFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => BasicInformationFilterInputSchema())).nullish(),
    complexProductCategory: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    description: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    exchange: z.lazy(() => ExchangeOperationFilterInputSchema().nullish()),
    fullDescription: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    fullName: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    gicsSector: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    market: z.lazy(() => MarketOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => BasicInformationFilterInputSchema())).nullish(),
    readableType: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    sector: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    shortName: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    symbol: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    type: z.lazy(() => StringOperationFilterInputSchema().nullish())
  })
}

export function BasicInformationSortInputSchema(): z.ZodObject<Properties<BasicInformationSortInput>> {
  return z.object({
    complexProductCategory: SortEnumTypeSchema.nullish(),
    description: SortEnumTypeSchema.nullish(),
    exchange: SortEnumTypeSchema.nullish(),
    fullDescription: SortEnumTypeSchema.nullish(),
    fullName: SortEnumTypeSchema.nullish(),
    gicsSector: SortEnumTypeSchema.nullish(),
    market: SortEnumTypeSchema.nullish(),
    readableType: SortEnumTypeSchema.nullish(),
    sector: SortEnumTypeSchema.nullish(),
    shortName: SortEnumTypeSchema.nullish(),
    symbol: SortEnumTypeSchema.nullish(),
    type: SortEnumTypeSchema.nullish()
  })
}

export function BoardInformationSchema(): z.ZodObject<Properties<BoardInformation>> {
  return z.object({
    __typename: z.literal('BoardInformation').optional(),
    board: z.string(),
    isPrimaryBoard: z.boolean(),
    primaryBoard: z.string()
  })
}

export function BoardInformationFilterInputSchema(): z.ZodObject<Properties<BoardInformationFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => BoardInformationFilterInputSchema())).nullish(),
    board: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    isPrimaryBoard: z.lazy(() => BooleanOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => BoardInformationFilterInputSchema())).nullish(),
    primaryBoard: z.lazy(() => StringOperationFilterInputSchema().nullish())
  })
}

export function BoardInformationSortInputSchema(): z.ZodObject<Properties<BoardInformationSortInput>> {
  return z.object({
    board: SortEnumTypeSchema.nullish(),
    isPrimaryBoard: SortEnumTypeSchema.nullish(),
    primaryBoard: SortEnumTypeSchema.nullish()
  })
}

export function BondSchema(): z.ZodObject<Properties<Bond>> {
  return z.object({
    __typename: z.literal('Bond').optional(),
    additionalInformation: z.lazy(() => AdditionalInformationSchema()),
    amortizations: z.array(z.lazy(() => AmortizationSchema())).nullish(),
    basicInformation: z.lazy(() => BasicInformationSchema()),
    boardInformation: z.lazy(() => BoardInformationSchema()),
    couponRate: z.number().nullish(),
    couponType: CouponTypeSchema.nullish(),
    coupons: z.array(z.lazy(() => CouponSchema())).nullish(),
    currencyInformation: z.lazy(() => CurrencyInformationSchema()),
    currentFaceValue: z.number(),
    duration: z.number().nullish(),
    durationMacaulay: z.number().nullish(),
    faceValue: z.number(),
    financialAttributes: z.lazy(() => FinancialAttributesSchema()),
    guaranteed: z.boolean(),
    hasAmortization: z.boolean(),
    hasOffer: z.boolean(),
    issuer: z.string().nullish(),
    maturityDate: z.string().nullish(),
    offers: z.array(z.lazy(() => OfferSchema())).nullish(),
    placementEndDate: z.string().nullish(),
    pledged: z.boolean(),
    tradingDetails: z.lazy(() => TradingDetailsSchema()),
    volumes: z.lazy(() => BondVolumesSchema().nullish()),
    yield: z.lazy(() => BondYieldSchema().nullish())
  })
}

export function BondAmortizationsArgsSchema(): z.ZodObject<Properties<BondAmortizationsArgs>> {
  return z.object({
    order: z.array(z.lazy(() => AmortizationSortInputSchema())).nullish(),
    where: z.lazy(() => AmortizationFilterInputSchema().nullish())
  })
}

export function BondCouponsArgsSchema(): z.ZodObject<Properties<BondCouponsArgs>> {
  return z.object({
    order: z.array(z.lazy(() => CouponSortInputSchema())).nullish(),
    where: z.lazy(() => CouponFilterInputSchema().nullish())
  })
}

export function BondOffersArgsSchema(): z.ZodObject<Properties<BondOffersArgs>> {
  return z.object({
    order: z.array(z.lazy(() => OfferSortInputSchema())).nullish(),
    where: z.lazy(() => OfferFilterInputSchema().nullish())
  })
}

export function BondEventTypeOperationFilterInputSchema(): z.ZodObject<Properties<BondEventTypeOperationFilterInput>> {
  return z.object({
    eq: BondEventTypeSchema.nullish(),
    in: z.array(BondEventTypeSchema).nullish(),
    neq: BondEventTypeSchema.nullish(),
    nin: z.array(BondEventTypeSchema).nullish()
  })
}

export function BondFilterInputSchema(): z.ZodObject<Properties<BondFilterInput>> {
  return z.object({
    additionalInformation: z.lazy(() => AdditionalInformationFilterInputSchema().nullish()),
    amortizations: z.lazy(() => ListFilterInputTypeOfAmortizationFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => BondFilterInputSchema())).nullish(),
    basicInformation: z.lazy(() => BasicInformationFilterInputSchema().nullish()),
    boardInformation: z.lazy(() => BoardInformationFilterInputSchema().nullish()),
    couponRate: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    couponType: z.lazy(() => NullableOfCouponTypeOperationFilterInputSchema().nullish()),
    coupons: z.lazy(() => ListFilterInputTypeOfCouponFilterInputSchema().nullish()),
    currencyInformation: z.lazy(() => CurrencyInformationFilterInputSchema().nullish()),
    currentFaceValue: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    duration: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    durationMacaulay: z.lazy(() => IntOperationFilterInputSchema().nullish()),
    faceValue: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    financialAttributes: z.lazy(() => FinancialAttributesFilterInputSchema().nullish()),
    guaranteed: z.lazy(() => BooleanOperationFilterInputSchema().nullish()),
    hasAmortization: z.lazy(() => BooleanOperationFilterInputSchema().nullish()),
    hasOffer: z.lazy(() => BooleanOperationFilterInputSchema().nullish()),
    issuer: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    maturityDate: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    offers: z.lazy(() => ListFilterInputTypeOfOfferFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => BondFilterInputSchema())).nullish(),
    placementEndDate: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    pledged: z.lazy(() => BooleanOperationFilterInputSchema().nullish()),
    tradingDetails: z.lazy(() => TradingDetailsFilterInputSchema().nullish()),
    volumes: z.lazy(() => BondVolumesFilterInputSchema().nullish()),
    yield: z.lazy(() => BondYieldFilterInputSchema().nullish())
  })
}

export function BondSortInputSchema(): z.ZodObject<Properties<BondSortInput>> {
  return z.object({
    additionalInformation: z.lazy(() => AdditionalInformationSortInputSchema().nullish()),
    basicInformation: z.lazy(() => BasicInformationSortInputSchema().nullish()),
    boardInformation: z.lazy(() => BoardInformationSortInputSchema().nullish()),
    couponRate: SortEnumTypeSchema.nullish(),
    couponType: SortEnumTypeSchema.nullish(),
    currencyInformation: z.lazy(() => CurrencyInformationSortInputSchema().nullish()),
    currentFaceValue: SortEnumTypeSchema.nullish(),
    duration: SortEnumTypeSchema.nullish(),
    durationMacaulay: SortEnumTypeSchema.nullish(),
    faceValue: SortEnumTypeSchema.nullish(),
    financialAttributes: z.lazy(() => FinancialAttributesSortInputSchema().nullish()),
    guaranteed: SortEnumTypeSchema.nullish(),
    hasAmortization: SortEnumTypeSchema.nullish(),
    hasOffer: SortEnumTypeSchema.nullish(),
    issuer: SortEnumTypeSchema.nullish(),
    maturityDate: SortEnumTypeSchema.nullish(),
    placementEndDate: SortEnumTypeSchema.nullish(),
    pledged: SortEnumTypeSchema.nullish(),
    tradingDetails: z.lazy(() => TradingDetailsSortInputSchema().nullish()),
    volumes: z.lazy(() => BondVolumesSortInputSchema().nullish()),
    yield: z.lazy(() => BondYieldSortInputSchema().nullish())
  })
}

export function BondVolumesSchema(): z.ZodObject<Properties<BondVolumes>> {
  return z.object({
    __typename: z.literal('BondVolumes').optional(),
    issueValue: z.number(),
    issueVolume: z.number(),
    marketValue: z.number(),
    marketVolume: z.number()
  })
}

export function BondVolumesFilterInputSchema(): z.ZodObject<Properties<BondVolumesFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => BondVolumesFilterInputSchema())).nullish(),
    issueValue: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    issueVolume: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    marketValue: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    marketVolume: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => BondVolumesFilterInputSchema())).nullish()
  })
}

export function BondVolumesSortInputSchema(): z.ZodObject<Properties<BondVolumesSortInput>> {
  return z.object({
    issueValue: SortEnumTypeSchema.nullish(),
    issueVolume: SortEnumTypeSchema.nullish(),
    marketValue: SortEnumTypeSchema.nullish(),
    marketVolume: SortEnumTypeSchema.nullish()
  })
}

export function BondYieldSchema(): z.ZodObject<Properties<BondYield>> {
  return z.object({
    __typename: z.literal('BondYield').optional(),
    currentYield: z.number(),
    yieldToMaturity: z.number()
  })
}

export function BondYieldFilterInputSchema(): z.ZodObject<Properties<BondYieldFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => BondYieldFilterInputSchema())).nullish(),
    currentYield: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => BondYieldFilterInputSchema())).nullish(),
    yieldToMaturity: z.lazy(() => DecimalOperationFilterInputSchema().nullish())
  })
}

export function BondYieldSortInputSchema(): z.ZodObject<Properties<BondYieldSortInput>> {
  return z.object({
    currentYield: SortEnumTypeSchema.nullish(),
    yieldToMaturity: SortEnumTypeSchema.nullish()
  })
}

export function BondsConnectionSchema(): z.ZodObject<Properties<BondsConnection>> {
  return z.object({
    __typename: z.literal('BondsConnection').optional(),
    edges: z.array(z.lazy(() => BondsEdgeSchema())).nullish(),
    nodes: z.array(z.lazy(() => BondSchema())).nullish(),
    pageInfo: z.lazy(() => PageInfoSchema()),
    totalCount: z.number()
  })
}

export function BondsEdgeSchema(): z.ZodObject<Properties<BondsEdge>> {
  return z.object({
    __typename: z.literal('BondsEdge').optional(),
    cursor: z.string(),
    node: z.lazy(() => BondSchema())
  })
}

export function BooleanOperationFilterInputSchema(): z.ZodObject<Properties<BooleanOperationFilterInput>> {
  return z.object({
    eq: z.boolean().nullish(),
    neq: z.boolean().nullish()
  })
}

export function CostEstimateSchema(): z.ZodObject<Properties<CostEstimate>> {
  return z.object({
    __typename: z.literal('CostEstimate').optional(),
    dilutedEarningsPerShare: z.number(),
    pricePerShare: z.number(),
    priceToEarnings: z.number()
  })
}

export function CostEstimateFilterInputSchema(): z.ZodObject<Properties<CostEstimateFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => CostEstimateFilterInputSchema())).nullish(),
    dilutedEarningsPerShare: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => CostEstimateFilterInputSchema())).nullish(),
    pricePerShare: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    priceToEarnings: z.lazy(() => DecimalOperationFilterInputSchema().nullish())
  })
}

export function CostEstimateSortInputSchema(): z.ZodObject<Properties<CostEstimateSortInput>> {
  return z.object({
    dilutedEarningsPerShare: SortEnumTypeSchema.nullish(),
    pricePerShare: SortEnumTypeSchema.nullish(),
    priceToEarnings: SortEnumTypeSchema.nullish()
  })
}

export function CouponSchema(): z.ZodObject<Properties<Coupon>> {
  return z.object({
    __typename: z.literal('Coupon').optional(),
    accruedInterest: z.number(),
    amount: z.number(),
    couponRate: z.number().nullish(),
    couponType: CouponTypeSchema,
    currency: z.string().nullish(),
    date: z.string(),
    fixDate: z.string().nullish(),
    intervalInDays: z.number(),
    isClosest: z.boolean(),
    value: z.number().nullish()
  })
}

export function CouponFilterInputSchema(): z.ZodObject<Properties<CouponFilterInput>> {
  return z.object({
    accruedInterest: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    amount: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => CouponFilterInputSchema())).nullish(),
    couponRate: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    couponType: z.lazy(() => CouponTypeOperationFilterInputSchema().nullish()),
    currency: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    date: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    fixDate: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    intervalInDays: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    isClosest: z.lazy(() => BooleanOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => CouponFilterInputSchema())).nullish(),
    value: z.lazy(() => DecimalOperationFilterInputSchema().nullish())
  })
}

export function CouponSortInputSchema(): z.ZodObject<Properties<CouponSortInput>> {
  return z.object({
    accruedInterest: SortEnumTypeSchema.nullish(),
    amount: SortEnumTypeSchema.nullish(),
    couponRate: SortEnumTypeSchema.nullish(),
    couponType: SortEnumTypeSchema.nullish(),
    currency: SortEnumTypeSchema.nullish(),
    date: SortEnumTypeSchema.nullish(),
    fixDate: SortEnumTypeSchema.nullish(),
    intervalInDays: SortEnumTypeSchema.nullish(),
    isClosest: SortEnumTypeSchema.nullish(),
    value: SortEnumTypeSchema.nullish()
  })
}

export function CouponTypeOperationFilterInputSchema(): z.ZodObject<Properties<CouponTypeOperationFilterInput>> {
  return z.object({
    eq: CouponTypeSchema.nullish(),
    in: z.array(CouponTypeSchema).nullish(),
    neq: CouponTypeSchema.nullish(),
    nin: z.array(CouponTypeSchema).nullish()
  })
}

export function CurrenciesConnectionSchema(): z.ZodObject<Properties<CurrenciesConnection>> {
  return z.object({
    __typename: z.literal('CurrenciesConnection').optional(),
    edges: z.array(z.lazy(() => CurrenciesEdgeSchema())).nullish(),
    nodes: z.array(z.lazy(() => CurrencySchema())).nullish(),
    pageInfo: z.lazy(() => PageInfoSchema()),
    totalCount: z.number()
  })
}

export function CurrenciesEdgeSchema(): z.ZodObject<Properties<CurrenciesEdge>> {
  return z.object({
    __typename: z.literal('CurrenciesEdge').optional(),
    cursor: z.string(),
    node: z.lazy(() => CurrencySchema())
  })
}

export function CurrencySchema(): z.ZodObject<Properties<Currency>> {
  return z.object({
    __typename: z.literal('Currency').optional(),
    additionalInformation: z.lazy(() => AdditionalInformationSchema()),
    basicInformation: z.lazy(() => BasicInformationSchema()),
    boardInformation: z.lazy(() => BoardInformationSchema()),
    currencyInformation: z.lazy(() => CurrencyInformationSchema()),
    financialAttributes: z.lazy(() => FinancialAttributesSchema()),
    tradingDetails: z.lazy(() => TradingDetailsSchema())
  })
}

export function CurrencyFilterInputSchema(): z.ZodObject<Properties<CurrencyFilterInput>> {
  return z.object({
    additionalInformation: z.lazy(() => AdditionalInformationFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => CurrencyFilterInputSchema())).nullish(),
    basicInformation: z.lazy(() => BasicInformationFilterInputSchema().nullish()),
    boardInformation: z.lazy(() => BoardInformationFilterInputSchema().nullish()),
    currencyInformation: z.lazy(() => CurrencyInformationFilterInputSchema().nullish()),
    financialAttributes: z.lazy(() => FinancialAttributesFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => CurrencyFilterInputSchema())).nullish(),
    tradingDetails: z.lazy(() => TradingDetailsFilterInputSchema().nullish())
  })
}

export function CurrencyInformationSchema(): z.ZodObject<Properties<CurrencyInformation>> {
  return z.object({
    __typename: z.literal('CurrencyInformation').optional(),
    nominal: z.string().nullish(),
    settlement: z.string().nullish()
  })
}

export function CurrencyInformationFilterInputSchema(): z.ZodObject<Properties<CurrencyInformationFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => CurrencyInformationFilterInputSchema())).nullish(),
    nominal: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => CurrencyInformationFilterInputSchema())).nullish(),
    settlement: z.lazy(() => StringOperationFilterInputSchema().nullish())
  })
}

export function CurrencyInformationSortInputSchema(): z.ZodObject<Properties<CurrencyInformationSortInput>> {
  return z.object({
    nominal: SortEnumTypeSchema.nullish(),
    settlement: SortEnumTypeSchema.nullish()
  })
}

export function CurrencySortInputSchema(): z.ZodObject<Properties<CurrencySortInput>> {
  return z.object({
    additionalInformation: z.lazy(() => AdditionalInformationSortInputSchema().nullish()),
    basicInformation: z.lazy(() => BasicInformationSortInputSchema().nullish()),
    boardInformation: z.lazy(() => BoardInformationSortInputSchema().nullish()),
    currencyInformation: z.lazy(() => CurrencyInformationSortInputSchema().nullish()),
    financialAttributes: z.lazy(() => FinancialAttributesSortInputSchema().nullish()),
    tradingDetails: z.lazy(() => TradingDetailsSortInputSchema().nullish())
  })
}

export function DateTimeOperationFilterInputSchema(): z.ZodObject<Properties<DateTimeOperationFilterInput>> {
  return z.object({
    eq: z.string().nullish(),
    gt: z.string().nullish(),
    gte: z.string().nullish(),
    in: z.array(z.string().nullable()).nullish(),
    lt: z.string().nullish(),
    lte: z.string().nullish(),
    neq: z.string().nullish(),
    ngt: z.string().nullish(),
    ngte: z.string().nullish(),
    nin: z.array(z.string().nullable()).nullish(),
    nlt: z.string().nullish(),
    nlte: z.string().nullish()
  })
}

export function DecimalOperationFilterInputSchema(): z.ZodObject<Properties<DecimalOperationFilterInput>> {
  return z.object({
    eq: z.number().nullish(),
    gt: z.number().nullish(),
    gte: z.number().nullish(),
    in: z.array(z.number().nullable()).nullish(),
    lt: z.number().nullish(),
    lte: z.number().nullish(),
    neq: z.number().nullish(),
    ngt: z.number().nullish(),
    ngte: z.number().nullish(),
    nin: z.array(z.number().nullable()).nullish(),
    nlt: z.number().nullish(),
    nlte: z.number().nullish()
  })
}

export function DerivativeSchema(): z.ZodObject<Properties<Derivative>> {
  return z.object({
    __typename: z.literal('Derivative').optional(),
    additionalInformation: z.lazy(() => AdditionalInformationSchema()),
    basicInformation: z.lazy(() => BasicInformationSchema()),
    boardInformation: z.lazy(() => BoardInformationSchema()),
    currencyInformation: z.lazy(() => CurrencyInformationSchema()),
    financialAttributes: z.lazy(() => FinancialAttributesSchema()),
    initialMargin: z.lazy(() => InitialMarginSchema()),
    marginBuy: z.number().nullish(),
    marginRate: z.number().nullish(),
    marginSell: z.number().nullish(),
    theorPrice: z.number(),
    theorPriceLimit: z.number(),
    tradingDetails: z.lazy(() => TradingDetailsSchema()),
    underlyingCurrency: z.string().nullish(),
    volatility: z.number()
  })
}

export function DerivativeFilterInputSchema(): z.ZodObject<Properties<DerivativeFilterInput>> {
  return z.object({
    additionalInformation: z.lazy(() => AdditionalInformationFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => DerivativeFilterInputSchema())).nullish(),
    basicInformation: z.lazy(() => BasicInformationFilterInputSchema().nullish()),
    boardInformation: z.lazy(() => BoardInformationFilterInputSchema().nullish()),
    currencyInformation: z.lazy(() => CurrencyInformationFilterInputSchema().nullish()),
    financialAttributes: z.lazy(() => FinancialAttributesFilterInputSchema().nullish()),
    initialMargin: z.lazy(() => InitialMarginFilterInputSchema().nullish()),
    marginBuy: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    marginRate: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    marginSell: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => DerivativeFilterInputSchema())).nullish(),
    theorPrice: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    theorPriceLimit: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    tradingDetails: z.lazy(() => TradingDetailsFilterInputSchema().nullish()),
    underlyingCurrency: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    volatility: z.lazy(() => DecimalOperationFilterInputSchema().nullish())
  })
}

export function DerivativeSortInputSchema(): z.ZodObject<Properties<DerivativeSortInput>> {
  return z.object({
    additionalInformation: z.lazy(() => AdditionalInformationSortInputSchema().nullish()),
    basicInformation: z.lazy(() => BasicInformationSortInputSchema().nullish()),
    boardInformation: z.lazy(() => BoardInformationSortInputSchema().nullish()),
    currencyInformation: z.lazy(() => CurrencyInformationSortInputSchema().nullish()),
    financialAttributes: z.lazy(() => FinancialAttributesSortInputSchema().nullish()),
    initialMargin: z.lazy(() => InitialMarginSortInputSchema().nullish()),
    marginBuy: SortEnumTypeSchema.nullish(),
    marginRate: SortEnumTypeSchema.nullish(),
    marginSell: SortEnumTypeSchema.nullish(),
    theorPrice: SortEnumTypeSchema.nullish(),
    theorPriceLimit: SortEnumTypeSchema.nullish(),
    tradingDetails: z.lazy(() => TradingDetailsSortInputSchema().nullish()),
    underlyingCurrency: SortEnumTypeSchema.nullish(),
    volatility: SortEnumTypeSchema.nullish()
  })
}

export function DerivativesConnectionSchema(): z.ZodObject<Properties<DerivativesConnection>> {
  return z.object({
    __typename: z.literal('DerivativesConnection').optional(),
    edges: z.array(z.lazy(() => DerivativesEdgeSchema())).nullish(),
    nodes: z.array(z.lazy(() => DerivativeSchema())).nullish(),
    pageInfo: z.lazy(() => PageInfoSchema()),
    totalCount: z.number()
  })
}

export function DerivativesEdgeSchema(): z.ZodObject<Properties<DerivativesEdge>> {
  return z.object({
    __typename: z.literal('DerivativesEdge').optional(),
    cursor: z.string(),
    node: z.lazy(() => DerivativeSchema())
  })
}

export function DividendSchema(): z.ZodObject<Properties<Dividend>> {
  return z.object({
    __typename: z.literal('Dividend').optional(),
    currency: z.string().nullish(),
    declaredPayDateNominee: z.string().nullish(),
    dividendPerShare: z.number(),
    dividendYield: z.number(),
    exDividendDate: z.string().nullish(),
    fixDate: z.string().nullish(),
    listDate: z.string().nullish(),
    recommendDividendPerShare: z.number(),
    recommendFixDate: z.string().nullish(),
    recordDate: z.string()
  })
}

export function DividendFilterInputSchema(): z.ZodObject<Properties<DividendFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => DividendFilterInputSchema())).nullish(),
    currency: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    declaredPayDateNominee: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    dividendPerShare: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    dividendYield: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    exDividendDate: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    fixDate: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    listDate: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => DividendFilterInputSchema())).nullish(),
    recommendDividendPerShare: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    recommendFixDate: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    recordDate: z.lazy(() => DateTimeOperationFilterInputSchema().nullish())
  })
}

export function DividendSortInputSchema(): z.ZodObject<Properties<DividendSortInput>> {
  return z.object({
    currency: SortEnumTypeSchema.nullish(),
    declaredPayDateNominee: SortEnumTypeSchema.nullish(),
    dividendPerShare: SortEnumTypeSchema.nullish(),
    dividendYield: SortEnumTypeSchema.nullish(),
    exDividendDate: SortEnumTypeSchema.nullish(),
    fixDate: SortEnumTypeSchema.nullish(),
    listDate: SortEnumTypeSchema.nullish(),
    recommendDividendPerShare: SortEnumTypeSchema.nullish(),
    recommendFixDate: SortEnumTypeSchema.nullish(),
    recordDate: SortEnumTypeSchema.nullish()
  })
}

export function DividendsAggregateInfoSchema(): z.ZodObject<Properties<DividendsAggregateInfo>> {
  return z.object({
    __typename: z.literal('DividendsAggregateInfo').optional(),
    averageDividendFor5years: z.number(),
    payoutRatio: z.number()
  })
}

export function DividendsAggregateInfoFilterInputSchema(): z.ZodObject<Properties<DividendsAggregateInfoFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => DividendsAggregateInfoFilterInputSchema())).nullish(),
    averageDividendFor5years: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => DividendsAggregateInfoFilterInputSchema())).nullish(),
    payoutRatio: z.lazy(() => DecimalOperationFilterInputSchema().nullish())
  })
}

export function DividendsAggregateInfoSortInputSchema(): z.ZodObject<Properties<DividendsAggregateInfoSortInput>> {
  return z.object({
    averageDividendFor5years: SortEnumTypeSchema.nullish(),
    payoutRatio: SortEnumTypeSchema.nullish()
  })
}

export function ExchangeOperationFilterInputSchema(): z.ZodObject<Properties<ExchangeOperationFilterInput>> {
  return z.object({
    eq: ExchangeSchema.nullish(),
    in: z.array(ExchangeSchema).nullish(),
    neq: ExchangeSchema.nullish(),
    nin: z.array(ExchangeSchema).nullish()
  })
}

export function FinancialAttributesSchema(): z.ZodObject<Properties<FinancialAttributes>> {
  return z.object({
    __typename: z.literal('FinancialAttributes').optional(),
    cfiCode: z.string(),
    currency: z.string().nullish(),
    isin: z.string().nullish(),
    tradingStatus: z.number(),
    tradingStatusInfo: z.string().nullish()
  })
}

export function FinancialAttributesFilterInputSchema(): z.ZodObject<Properties<FinancialAttributesFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => FinancialAttributesFilterInputSchema())).nullish(),
    cfiCode: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    currency: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    isin: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => FinancialAttributesFilterInputSchema())).nullish(),
    tradingStatus: z.lazy(() => IntOperationFilterInputSchema().nullish()),
    tradingStatusInfo: z.lazy(() => StringOperationFilterInputSchema().nullish())
  })
}

export function FinancialAttributesSortInputSchema(): z.ZodObject<Properties<FinancialAttributesSortInput>> {
  return z.object({
    cfiCode: SortEnumTypeSchema.nullish(),
    currency: SortEnumTypeSchema.nullish(),
    isin: SortEnumTypeSchema.nullish(),
    tradingStatus: SortEnumTypeSchema.nullish(),
    tradingStatusInfo: SortEnumTypeSchema.nullish()
  })
}

export function InitialMarginSchema(): z.ZodObject<Properties<InitialMargin>> {
  return z.object({
    __typename: z.literal('InitialMargin').optional(),
    highRiskLong: z.number(),
    highRiskShort: z.number(),
    lowRiskLong: z.number(),
    lowRiskShort: z.number(),
    specialRiskLong: z.number(),
    specialRiskShort: z.number(),
    standardRiskLong: z.number(),
    standardRiskShort: z.number()
  })
}

export function InitialMarginFilterInputSchema(): z.ZodObject<Properties<InitialMarginFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => InitialMarginFilterInputSchema())).nullish(),
    highRiskLong: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    highRiskShort: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    lowRiskLong: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    lowRiskShort: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => InitialMarginFilterInputSchema())).nullish(),
    specialRiskLong: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    specialRiskShort: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    standardRiskLong: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    standardRiskShort: z.lazy(() => DecimalOperationFilterInputSchema().nullish())
  })
}

export function InitialMarginSortInputSchema(): z.ZodObject<Properties<InitialMarginSortInput>> {
  return z.object({
    highRiskLong: SortEnumTypeSchema.nullish(),
    highRiskShort: SortEnumTypeSchema.nullish(),
    lowRiskLong: SortEnumTypeSchema.nullish(),
    lowRiskShort: SortEnumTypeSchema.nullish(),
    specialRiskLong: SortEnumTypeSchema.nullish(),
    specialRiskShort: SortEnumTypeSchema.nullish(),
    standardRiskLong: SortEnumTypeSchema.nullish(),
    standardRiskShort: SortEnumTypeSchema.nullish()
  })
}

export function InstrumentSchema(): z.ZodObject<Properties<Instrument>> {
  return z.object({
    additionalInformation: z.lazy(() => AdditionalInformationSchema()),
    basicInformation: z.lazy(() => BasicInformationSchema()),
    boardInformation: z.lazy(() => BoardInformationSchema()),
    currencyInformation: z.lazy(() => CurrencyInformationSchema()),
    financialAttributes: z.lazy(() => FinancialAttributesSchema()),
    tradingDetails: z.lazy(() => TradingDetailsSchema())
  })
}

export function InstrumentModelFilterInputSchema(): z.ZodObject<Properties<InstrumentModelFilterInput>> {
  return z.object({
    additionalInformation: z.lazy(() => AdditionalInformationFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => InstrumentModelFilterInputSchema())).nullish(),
    basicInformation: z.lazy(() => BasicInformationFilterInputSchema().nullish()),
    boardInformation: z.lazy(() => BoardInformationFilterInputSchema().nullish()),
    currencyInformation: z.lazy(() => CurrencyInformationFilterInputSchema().nullish()),
    financialAttributes: z.lazy(() => FinancialAttributesFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => InstrumentModelFilterInputSchema())).nullish(),
    tradingDetails: z.lazy(() => TradingDetailsFilterInputSchema().nullish())
  })
}

export function InstrumentModelSortInputSchema(): z.ZodObject<Properties<InstrumentModelSortInput>> {
  return z.object({
    additionalInformation: z.lazy(() => AdditionalInformationSortInputSchema().nullish()),
    basicInformation: z.lazy(() => BasicInformationSortInputSchema().nullish()),
    boardInformation: z.lazy(() => BoardInformationSortInputSchema().nullish()),
    currencyInformation: z.lazy(() => CurrencyInformationSortInputSchema().nullish()),
    financialAttributes: z.lazy(() => FinancialAttributesSortInputSchema().nullish()),
    tradingDetails: z.lazy(() => TradingDetailsSortInputSchema().nullish())
  })
}

export function InstrumentsConnectionSchema(): z.ZodObject<Properties<InstrumentsConnection>> {
  return z.object({
    __typename: z.literal('InstrumentsConnection').optional(),
    edges: z.array(z.lazy(() => InstrumentsEdgeSchema())).nullish(),
    nodes: z.array(z.lazy(() => InstrumentSchema())).nullish(),
    pageInfo: z.lazy(() => PageInfoSchema()),
    totalCount: z.number()
  })
}

export function InstrumentsEdgeSchema(): z.ZodObject<Properties<InstrumentsEdge>> {
  return z.object({
    __typename: z.literal('InstrumentsEdge').optional(),
    cursor: z.string(),
    node: z.lazy(() => InstrumentSchema())
  })
}

export function IntOperationFilterInputSchema(): z.ZodObject<Properties<IntOperationFilterInput>> {
  return z.object({
    eq: z.number().nullish(),
    gt: z.number().nullish(),
    gte: z.number().nullish(),
    in: z.array(z.number().nullable()).nullish(),
    lt: z.number().nullish(),
    lte: z.number().nullish(),
    neq: z.number().nullish(),
    ngt: z.number().nullish(),
    ngte: z.number().nullish(),
    nin: z.array(z.number().nullable()).nullish(),
    nlt: z.number().nullish(),
    nlte: z.number().nullish()
  })
}

export function ListFilterInputTypeOfAmortizationFilterInputSchema(): z.ZodObject<Properties<ListFilterInputTypeOfAmortizationFilterInput>> {
  return z.object({
    all: z.lazy(() => AmortizationFilterInputSchema().nullish()),
    any: z.boolean().nullish(),
    none: z.lazy(() => AmortizationFilterInputSchema().nullish()),
    some: z.lazy(() => AmortizationFilterInputSchema().nullish())
  })
}

export function ListFilterInputTypeOfCouponFilterInputSchema(): z.ZodObject<Properties<ListFilterInputTypeOfCouponFilterInput>> {
  return z.object({
    all: z.lazy(() => CouponFilterInputSchema().nullish()),
    any: z.boolean().nullish(),
    none: z.lazy(() => CouponFilterInputSchema().nullish()),
    some: z.lazy(() => CouponFilterInputSchema().nullish())
  })
}

export function ListFilterInputTypeOfDividendFilterInputSchema(): z.ZodObject<Properties<ListFilterInputTypeOfDividendFilterInput>> {
  return z.object({
    all: z.lazy(() => DividendFilterInputSchema().nullish()),
    any: z.boolean().nullish(),
    none: z.lazy(() => DividendFilterInputSchema().nullish()),
    some: z.lazy(() => DividendFilterInputSchema().nullish())
  })
}

export function ListFilterInputTypeOfOfferFilterInputSchema(): z.ZodObject<Properties<ListFilterInputTypeOfOfferFilterInput>> {
  return z.object({
    all: z.lazy(() => OfferFilterInputSchema().nullish()),
    any: z.boolean().nullish(),
    none: z.lazy(() => OfferFilterInputSchema().nullish()),
    some: z.lazy(() => OfferFilterInputSchema().nullish())
  })
}

export function ListFilterInputTypeOfValuePerQuarterFilterInputSchema(): z.ZodObject<Properties<ListFilterInputTypeOfValuePerQuarterFilterInput>> {
  return z.object({
    all: z.lazy(() => ValuePerQuarterFilterInputSchema().nullish()),
    any: z.boolean().nullish(),
    none: z.lazy(() => ValuePerQuarterFilterInputSchema().nullish()),
    some: z.lazy(() => ValuePerQuarterFilterInputSchema().nullish())
  })
}

export function ListFilterInputTypeOfValuePerYearFilterInputSchema(): z.ZodObject<Properties<ListFilterInputTypeOfValuePerYearFilterInput>> {
  return z.object({
    all: z.lazy(() => ValuePerYearFilterInputSchema().nullish()),
    any: z.boolean().nullish(),
    none: z.lazy(() => ValuePerYearFilterInputSchema().nullish()),
    some: z.lazy(() => ValuePerYearFilterInputSchema().nullish())
  })
}

export function LongOperationFilterInputSchema(): z.ZodObject<Properties<LongOperationFilterInput>> {
  return z.object({
    eq: z.number().nullish(),
    gt: z.number().nullish(),
    gte: z.number().nullish(),
    in: z.array(z.number().nullable()).nullish(),
    lt: z.number().nullish(),
    lte: z.number().nullish(),
    neq: z.number().nullish(),
    ngt: z.number().nullish(),
    ngte: z.number().nullish(),
    nin: z.array(z.number().nullable()).nullish(),
    nlt: z.number().nullish(),
    nlte: z.number().nullish()
  })
}

export function MainIndicatorsSchema(): z.ZodObject<Properties<MainIndicators>> {
  return z.object({
    __typename: z.literal('MainIndicators').optional(),
    ebitda: z.number(),
    marketCap: z.number()
  })
}

export function MainIndicatorsFilterInputSchema(): z.ZodObject<Properties<MainIndicatorsFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => MainIndicatorsFilterInputSchema())).nullish(),
    ebitda: z.lazy(() => LongOperationFilterInputSchema().nullish()),
    marketCap: z.lazy(() => LongOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => MainIndicatorsFilterInputSchema())).nullish()
  })
}

export function MainIndicatorsSortInputSchema(): z.ZodObject<Properties<MainIndicatorsSortInput>> {
  return z.object({
    ebitda: SortEnumTypeSchema.nullish(),
    marketCap: SortEnumTypeSchema.nullish()
  })
}

export function MarketOperationFilterInputSchema(): z.ZodObject<Properties<MarketOperationFilterInput>> {
  return z.object({
    eq: MarketSchema.nullish(),
    in: z.array(MarketSchema).nullish(),
    neq: MarketSchema.nullish(),
    nin: z.array(MarketSchema).nullish()
  })
}

export function NetIncomeSchema(): z.ZodObject<Properties<NetIncome>> {
  return z.object({
    __typename: z.literal('NetIncome').optional(),
    year: z.array(z.lazy(() => ValuePerYearSchema())).nullish()
  })
}

export function NetIncomeFilterInputSchema(): z.ZodObject<Properties<NetIncomeFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => NetIncomeFilterInputSchema())).nullish(),
    or: z.array(z.lazy(() => NetIncomeFilterInputSchema())).nullish(),
    year: z.lazy(() => ListFilterInputTypeOfValuePerYearFilterInputSchema().nullish())
  })
}

export function NullableOfCouponTypeOperationFilterInputSchema(): z.ZodObject<Properties<NullableOfCouponTypeOperationFilterInput>> {
  return z.object({
    eq: CouponTypeSchema.nullish(),
    in: z.array(CouponTypeSchema.nullable()).nullish(),
    neq: CouponTypeSchema.nullish(),
    nin: z.array(CouponTypeSchema.nullable()).nullish()
  })
}

export function OfferSchema(): z.ZodObject<Properties<Offer>> {
  return z.object({
    __typename: z.literal('Offer').optional(),
    amount: z.number(),
    begOrder: z.string().nullish(),
    bondEventType: BondEventTypeSchema,
    currency: z.string().nullish(),
    date: z.string(),
    description: z.string().nullish(),
    endOrder: z.string().nullish(),
    fixDate: z.string().nullish(),
    isClosest: z.boolean(),
    value: z.number().nullish()
  })
}

export function OfferFilterInputSchema(): z.ZodObject<Properties<OfferFilterInput>> {
  return z.object({
    amount: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => OfferFilterInputSchema())).nullish(),
    begOrder: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    bondEventType: z.lazy(() => BondEventTypeOperationFilterInputSchema().nullish()),
    currency: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    date: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    description: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    endOrder: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    fixDate: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    isClosest: z.lazy(() => BooleanOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => OfferFilterInputSchema())).nullish(),
    value: z.lazy(() => DecimalOperationFilterInputSchema().nullish())
  })
}

export function OfferSortInputSchema(): z.ZodObject<Properties<OfferSortInput>> {
  return z.object({
    amount: SortEnumTypeSchema.nullish(),
    begOrder: SortEnumTypeSchema.nullish(),
    bondEventType: SortEnumTypeSchema.nullish(),
    currency: SortEnumTypeSchema.nullish(),
    date: SortEnumTypeSchema.nullish(),
    description: SortEnumTypeSchema.nullish(),
    endOrder: SortEnumTypeSchema.nullish(),
    fixDate: SortEnumTypeSchema.nullish(),
    isClosest: SortEnumTypeSchema.nullish(),
    value: SortEnumTypeSchema.nullish()
  })
}

export function OtherSchema(): z.ZodObject<Properties<Other>> {
  return z.object({
    __typename: z.literal('Other').optional(),
    additionalInformation: z.lazy(() => AdditionalInformationSchema()),
    basicInformation: z.lazy(() => BasicInformationSchema()),
    boardInformation: z.lazy(() => BoardInformationSchema()),
    currencyInformation: z.lazy(() => CurrencyInformationSchema()),
    financialAttributes: z.lazy(() => FinancialAttributesSchema()),
    tradingDetails: z.lazy(() => TradingDetailsSchema())
  })
}

export function PageInfoSchema(): z.ZodObject<Properties<PageInfo>> {
  return z.object({
    __typename: z.literal('PageInfo').optional(),
    endCursor: z.string().nullish(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    startCursor: z.string().nullish()
  })
}

export function ProfitabilitySchema(): z.ZodObject<Properties<Profitability>> {
  return z.object({
    __typename: z.literal('Profitability').optional(),
    debtPerEquity: z.number(),
    returnOnAssets: z.number(),
    returnOnEquity: z.number()
  })
}

export function ProfitabilityFilterInputSchema(): z.ZodObject<Properties<ProfitabilityFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => ProfitabilityFilterInputSchema())).nullish(),
    debtPerEquity: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => ProfitabilityFilterInputSchema())).nullish(),
    returnOnAssets: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    returnOnEquity: z.lazy(() => DecimalOperationFilterInputSchema().nullish())
  })
}

export function ProfitabilitySortInputSchema(): z.ZodObject<Properties<ProfitabilitySortInput>> {
  return z.object({
    debtPerEquity: SortEnumTypeSchema.nullish(),
    returnOnAssets: SortEnumTypeSchema.nullish(),
    returnOnEquity: SortEnumTypeSchema.nullish()
  })
}

export function SalesSchema(): z.ZodObject<Properties<Sales>> {
  return z.object({
    __typename: z.literal('Sales').optional(),
    quarter: z.array(z.lazy(() => ValuePerQuarterSchema())).nullish(),
    year: z.array(z.lazy(() => ValuePerYearSchema())).nullish()
  })
}

export function SalesFilterInputSchema(): z.ZodObject<Properties<SalesFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => SalesFilterInputSchema())).nullish(),
    or: z.array(z.lazy(() => SalesFilterInputSchema())).nullish(),
    quarter: z.lazy(() => ListFilterInputTypeOfValuePerQuarterFilterInputSchema().nullish()),
    year: z.lazy(() => ListFilterInputTypeOfValuePerYearFilterInputSchema().nullish())
  })
}

export function StockSchema(): z.ZodObject<Properties<Stock>> {
  return z.object({
    __typename: z.literal('Stock').optional(),
    additionalInformation: z.lazy(() => AdditionalInformationSchema()),
    basicInformation: z.lazy(() => BasicInformationSchema()),
    boardInformation: z.lazy(() => BoardInformationSchema()),
    costEstimate: z.lazy(() => CostEstimateSchema().nullish()),
    currencyInformation: z.lazy(() => CurrencyInformationSchema()),
    dividends: z.array(z.lazy(() => DividendSchema())).nullish(),
    dividendsAggregateInfo: z.lazy(() => DividendsAggregateInfoSchema().nullish()),
    financialAttributes: z.lazy(() => FinancialAttributesSchema()),
    mainIndicators: z.lazy(() => MainIndicatorsSchema().nullish()),
    netIncome: z.lazy(() => NetIncomeSchema().nullish()),
    profitability: z.lazy(() => ProfitabilitySchema().nullish()),
    sales: z.lazy(() => SalesSchema().nullish()),
    trading: z.lazy(() => TradingSchema().nullish()),
    tradingDetails: z.lazy(() => TradingDetailsSchema())
  })
}

export function StockDividendsArgsSchema(): z.ZodObject<Properties<StockDividendsArgs>> {
  return z.object({
    order: z.array(z.lazy(() => DividendSortInputSchema())).nullish(),
    where: z.lazy(() => DividendFilterInputSchema().nullish())
  })
}

export function StockFilterInputSchema(): z.ZodObject<Properties<StockFilterInput>> {
  return z.object({
    additionalInformation: z.lazy(() => AdditionalInformationFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => StockFilterInputSchema())).nullish(),
    basicInformation: z.lazy(() => BasicInformationFilterInputSchema().nullish()),
    boardInformation: z.lazy(() => BoardInformationFilterInputSchema().nullish()),
    costEstimate: z.lazy(() => CostEstimateFilterInputSchema().nullish()),
    currencyInformation: z.lazy(() => CurrencyInformationFilterInputSchema().nullish()),
    dividends: z.lazy(() => ListFilterInputTypeOfDividendFilterInputSchema().nullish()),
    dividendsAggregateInfo: z.lazy(() => DividendsAggregateInfoFilterInputSchema().nullish()),
    financialAttributes: z.lazy(() => FinancialAttributesFilterInputSchema().nullish()),
    mainIndicators: z.lazy(() => MainIndicatorsFilterInputSchema().nullish()),
    netIncome: z.lazy(() => NetIncomeFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => StockFilterInputSchema())).nullish(),
    profitability: z.lazy(() => ProfitabilityFilterInputSchema().nullish()),
    sales: z.lazy(() => SalesFilterInputSchema().nullish()),
    trading: z.lazy(() => TradingFilterInputSchema().nullish()),
    tradingDetails: z.lazy(() => TradingDetailsFilterInputSchema().nullish())
  })
}

export function StockSortInputSchema(): z.ZodObject<Properties<StockSortInput>> {
  return z.object({
    additionalInformation: z.lazy(() => AdditionalInformationSortInputSchema().nullish()),
    basicInformation: z.lazy(() => BasicInformationSortInputSchema().nullish()),
    boardInformation: z.lazy(() => BoardInformationSortInputSchema().nullish()),
    costEstimate: z.lazy(() => CostEstimateSortInputSchema().nullish()),
    currencyInformation: z.lazy(() => CurrencyInformationSortInputSchema().nullish()),
    dividendsAggregateInfo: z.lazy(() => DividendsAggregateInfoSortInputSchema().nullish()),
    financialAttributes: z.lazy(() => FinancialAttributesSortInputSchema().nullish()),
    mainIndicators: z.lazy(() => MainIndicatorsSortInputSchema().nullish()),
    profitability: z.lazy(() => ProfitabilitySortInputSchema().nullish()),
    trading: z.lazy(() => TradingSortInputSchema().nullish()),
    tradingDetails: z.lazy(() => TradingDetailsSortInputSchema().nullish())
  })
}

export function StocksConnectionSchema(): z.ZodObject<Properties<StocksConnection>> {
  return z.object({
    __typename: z.literal('StocksConnection').optional(),
    edges: z.array(z.lazy(() => StocksEdgeSchema())).nullish(),
    nodes: z.array(z.lazy(() => StockSchema())).nullish(),
    pageInfo: z.lazy(() => PageInfoSchema()),
    totalCount: z.number()
  })
}

export function StocksEdgeSchema(): z.ZodObject<Properties<StocksEdge>> {
  return z.object({
    __typename: z.literal('StocksEdge').optional(),
    cursor: z.string(),
    node: z.lazy(() => StockSchema())
  })
}

export function StringOperationFilterInputSchema(): z.ZodObject<Properties<StringOperationFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => StringOperationFilterInputSchema())).nullish(),
    contains: z.string().nullish(),
    endsWith: z.string().nullish(),
    eq: z.string().nullish(),
    in: z.array(z.string().nullable()).nullish(),
    ncontains: z.string().nullish(),
    nendsWith: z.string().nullish(),
    neq: z.string().nullish(),
    nin: z.array(z.string().nullable()).nullish(),
    nstartsWith: z.string().nullish(),
    or: z.array(z.lazy(() => StringOperationFilterInputSchema())).nullish(),
    startsWith: z.string().nullish()
  })
}

export function SwapSchema(): z.ZodObject<Properties<Swap>> {
  return z.object({
    __typename: z.literal('Swap').optional(),
    additionalInformation: z.lazy(() => AdditionalInformationSchema()),
    baseSwapPrice: z.number(),
    basicInformation: z.lazy(() => BasicInformationSchema()),
    boardInformation: z.lazy(() => BoardInformationSchema()),
    currencyInformation: z.lazy(() => CurrencyInformationSchema()),
    financialAttributes: z.lazy(() => FinancialAttributesSchema()),
    tradingDetails: z.lazy(() => TradingDetailsSchema())
  })
}

export function SwapFilterInputSchema(): z.ZodObject<Properties<SwapFilterInput>> {
  return z.object({
    additionalInformation: z.lazy(() => AdditionalInformationFilterInputSchema().nullish()),
    and: z.array(z.lazy(() => SwapFilterInputSchema())).nullish(),
    baseSwapPrice: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    basicInformation: z.lazy(() => BasicInformationFilterInputSchema().nullish()),
    boardInformation: z.lazy(() => BoardInformationFilterInputSchema().nullish()),
    currencyInformation: z.lazy(() => CurrencyInformationFilterInputSchema().nullish()),
    financialAttributes: z.lazy(() => FinancialAttributesFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => SwapFilterInputSchema())).nullish(),
    tradingDetails: z.lazy(() => TradingDetailsFilterInputSchema().nullish())
  })
}

export function SwapSortInputSchema(): z.ZodObject<Properties<SwapSortInput>> {
  return z.object({
    additionalInformation: z.lazy(() => AdditionalInformationSortInputSchema().nullish()),
    baseSwapPrice: SortEnumTypeSchema.nullish(),
    basicInformation: z.lazy(() => BasicInformationSortInputSchema().nullish()),
    boardInformation: z.lazy(() => BoardInformationSortInputSchema().nullish()),
    currencyInformation: z.lazy(() => CurrencyInformationSortInputSchema().nullish()),
    financialAttributes: z.lazy(() => FinancialAttributesSortInputSchema().nullish()),
    tradingDetails: z.lazy(() => TradingDetailsSortInputSchema().nullish())
  })
}

export function SwapsConnectionSchema(): z.ZodObject<Properties<SwapsConnection>> {
  return z.object({
    __typename: z.literal('SwapsConnection').optional(),
    edges: z.array(z.lazy(() => SwapsEdgeSchema())).nullish(),
    nodes: z.array(z.lazy(() => SwapSchema())).nullish(),
    pageInfo: z.lazy(() => PageInfoSchema()),
    totalCount: z.number()
  })
}

export function SwapsEdgeSchema(): z.ZodObject<Properties<SwapsEdge>> {
  return z.object({
    __typename: z.literal('SwapsEdge').optional(),
    cursor: z.string(),
    node: z.lazy(() => SwapSchema())
  })
}

export function TradingSchema(): z.ZodObject<Properties<Trading>> {
  return z.object({
    __typename: z.literal('Trading').optional(),
    averageTurnoverPerDay: z.number(),
    averageTurnoverPerMonth: z.number(),
    closePrice: z.number(),
    maxFor52Weeks: z.number(),
    minFor52Weeks: z.number()
  })
}

export function TradingDetailsSchema(): z.ZodObject<Properties<TradingDetails>> {
  return z.object({
    __typename: z.literal('TradingDetails').optional(),
    capitalization: z.number(),
    closingPrice: z.number(),
    dailyGrowth: z.number(),
    dailyGrowthPercent: z.number(),
    lotSize: z.number(),
    minStep: z.number(),
    price: z.number(),
    priceMax: z.number(),
    priceMin: z.number(),
    priceStep: z.number(),
    rating: z.number(),
    tradeAmount: z.number(),
    tradeVolume: z.number()
  })
}

export function TradingDetailsFilterInputSchema(): z.ZodObject<Properties<TradingDetailsFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => TradingDetailsFilterInputSchema())).nullish(),
    capitalization: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    closingPrice: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    dailyGrowth: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    dailyGrowthPercent: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    lotSize: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    minStep: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => TradingDetailsFilterInputSchema())).nullish(),
    price: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    priceMax: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    priceMin: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    priceStep: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    rating: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    tradeAmount: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    tradeVolume: z.lazy(() => DecimalOperationFilterInputSchema().nullish())
  })
}

export function TradingDetailsSortInputSchema(): z.ZodObject<Properties<TradingDetailsSortInput>> {
  return z.object({
    capitalization: SortEnumTypeSchema.nullish(),
    closingPrice: SortEnumTypeSchema.nullish(),
    dailyGrowth: SortEnumTypeSchema.nullish(),
    dailyGrowthPercent: SortEnumTypeSchema.nullish(),
    lotSize: SortEnumTypeSchema.nullish(),
    minStep: SortEnumTypeSchema.nullish(),
    price: SortEnumTypeSchema.nullish(),
    priceMax: SortEnumTypeSchema.nullish(),
    priceMin: SortEnumTypeSchema.nullish(),
    priceStep: SortEnumTypeSchema.nullish(),
    rating: SortEnumTypeSchema.nullish(),
    tradeAmount: SortEnumTypeSchema.nullish(),
    tradeVolume: SortEnumTypeSchema.nullish()
  })
}

export function TradingFilterInputSchema(): z.ZodObject<Properties<TradingFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => TradingFilterInputSchema())).nullish(),
    averageTurnoverPerDay: z.lazy(() => LongOperationFilterInputSchema().nullish()),
    averageTurnoverPerMonth: z.lazy(() => LongOperationFilterInputSchema().nullish()),
    closePrice: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    maxFor52Weeks: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    minFor52Weeks: z.lazy(() => DecimalOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => TradingFilterInputSchema())).nullish()
  })
}

export function TradingSortInputSchema(): z.ZodObject<Properties<TradingSortInput>> {
  return z.object({
    averageTurnoverPerDay: SortEnumTypeSchema.nullish(),
    averageTurnoverPerMonth: SortEnumTypeSchema.nullish(),
    closePrice: SortEnumTypeSchema.nullish(),
    maxFor52Weeks: SortEnumTypeSchema.nullish(),
    minFor52Weeks: SortEnumTypeSchema.nullish()
  })
}

export function ValuePerQuarterSchema(): z.ZodObject<Properties<ValuePerQuarter>> {
  return z.object({
    __typename: z.literal('ValuePerQuarter').optional(),
    quarter: z.number(),
    value: z.number(),
    year: z.number()
  })
}

export function ValuePerQuarterFilterInputSchema(): z.ZodObject<Properties<ValuePerQuarterFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => ValuePerQuarterFilterInputSchema())).nullish(),
    or: z.array(z.lazy(() => ValuePerQuarterFilterInputSchema())).nullish(),
    quarter: z.lazy(() => IntOperationFilterInputSchema().nullish()),
    value: z.lazy(() => LongOperationFilterInputSchema().nullish()),
    year: z.lazy(() => IntOperationFilterInputSchema().nullish())
  })
}

export function ValuePerYearSchema(): z.ZodObject<Properties<ValuePerYear>> {
  return z.object({
    __typename: z.literal('ValuePerYear').optional(),
    value: z.number(),
    year: z.number()
  })
}

export function ValuePerYearFilterInputSchema(): z.ZodObject<Properties<ValuePerYearFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => ValuePerYearFilterInputSchema())).nullish(),
    or: z.array(z.lazy(() => ValuePerYearFilterInputSchema())).nullish(),
    value: z.lazy(() => LongOperationFilterInputSchema().nullish()),
    year: z.lazy(() => IntOperationFilterInputSchema().nullish())
  })
}
