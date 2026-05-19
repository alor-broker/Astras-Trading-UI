import {
  Modify,
  ZodPropertiesOf
} from "@terminal-core-lib/features/graphql/utils/zod-types.helper";
import {
  boolean,
  number,
  object,
  string,
  TypeOf,
  ZodObject
} from "zod/v3";
import {InstrumentsGraphQlHelper} from '@terminal-core-lib/features/instruments/utils/instruments-graph-ql.helper';
import {
  Amortization,
  Bond,
  BondsConnection,
  BondsEdge,
  BondVolumes,
  BondYield,
  Coupon,
  Offer,
  Query
} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';
import {
  AmortizationSchema,
  BondVolumesSchema,
  BondYieldSchema,
  CouponSchema,
  OfferSchema
} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.schemas';
import {PageInfoSchema} from '@terminal-core-lib/features/news/graphql/schema/graphql.schemas';

export function getBondScreenerResponseSchema(columnIds: string[]): ZodObject<ZodPropertiesOf<unknown>> {
  const GetBondScreenerBasicInformationSchema = InstrumentsGraphQlHelper.getBasicInformationPartialSchema(columnIds);
  const GetBondScreenerAdditionalInformationSchema = InstrumentsGraphQlHelper.getAdditionalInformationSchema(columnIds);
  const GetBondScreenerFinancialAttributesSchema = InstrumentsGraphQlHelper.getFinancialAttributesSchema(columnIds);
  const GetBondScreenerBoardInformationSchema = InstrumentsGraphQlHelper.getBoardInformationSchema(columnIds);
  const GetBondScreenerTradingDetailsSchema = InstrumentsGraphQlHelper.getTradingDetailsSchema(columnIds);
  const GetBondScreenerVolumesSchema = InstrumentsGraphQlHelper.getPartialSchema<BondVolumes>(BondVolumesSchema(), columnIds);
  const GetBondScreenerYieldSchema = InstrumentsGraphQlHelper.getPartialSchema<BondYield>(BondYieldSchema(), columnIds);
  const GetBondScreenerCouponsSchema = InstrumentsGraphQlHelper.getPartialSchema<Coupon>(CouponSchema(), columnIds, ['date', 'isClosest'], 'coupon').array();
  const GetBondScreenerOffersSchema = InstrumentsGraphQlHelper.getPartialSchema<Offer>(OfferSchema(), columnIds, ['date', 'isClosest'], 'offer').array();
  const GetBondScreenerAmortizationsSchema = InstrumentsGraphQlHelper.getPartialSchema<Amortization>(AmortizationSchema(), columnIds, ['date']).array();

  type GetBondScreenerBond = Modify<
    Bond,
    'basicInformation' |
    'additionalInformation' |
    'financialAttributes' |
    'boardInformation' |
    'tradingDetails' |
    'volumes' |
    'faceValue' |
    'currentFaceValue' |
    'yield' |
    'coupons' |
    'offers' |
    'amortizations' |
    'maturityDate' |
    'duration' |
    'durationMacaulay' |
    'couponRate' |
    'couponType' |
    'guaranteed' |
    'hasOffer' |
    'hasAmortization' |
    'placementEndDate',
    {
      basicInformation: TypeOf<typeof GetBondScreenerBasicInformationSchema>;
      additionalInformation: TypeOf<typeof GetBondScreenerAdditionalInformationSchema>;
      financialAttributes: TypeOf<typeof GetBondScreenerFinancialAttributesSchema>;
      boardInformation: TypeOf<typeof GetBondScreenerBoardInformationSchema>;
      tradingDetails: TypeOf<typeof GetBondScreenerTradingDetailsSchema>;
      volumes: TypeOf<typeof GetBondScreenerVolumesSchema>;
      yield: TypeOf<typeof GetBondScreenerYieldSchema>;
      coupons: TypeOf<typeof GetBondScreenerCouponsSchema>;
      offers: TypeOf<typeof GetBondScreenerOffersSchema>;
      amortizations: TypeOf<typeof GetBondScreenerAmortizationsSchema>;
      maturityDate: string;
      duration: number;
      durationMacaulay: number;
      couponRate: number;
      couponType: string;
      guaranteed: boolean;
      hasAmortization: boolean;
      hasOffer: boolean;
      placementEndDate: string;
    }
  >;

  const GetBondScreenerBondSchema: ZodObject<ZodPropertiesOf<GetBondScreenerBond>> = object({
    basicInformation: GetBondScreenerBasicInformationSchema,
    ...(Object.keys(GetBondScreenerAdditionalInformationSchema.shape).length === 0 ? {} : {additionalInformation: GetBondScreenerAdditionalInformationSchema}),
    ...(Object.keys(GetBondScreenerFinancialAttributesSchema.shape).length === 0 ? {} : {financialAttributes: GetBondScreenerFinancialAttributesSchema}),
    ...(Object.keys(GetBondScreenerBoardInformationSchema.shape).length === 0 ? {} : {boardInformation: GetBondScreenerBoardInformationSchema}),
    ...(Object.keys(GetBondScreenerTradingDetailsSchema.shape).length === 0 ? {} : {tradingDetails: GetBondScreenerTradingDetailsSchema}),
    ...(Object.keys(GetBondScreenerVolumesSchema.shape).length === 0 ? {} : {volumes: GetBondScreenerVolumesSchema}),
    ...(Object.keys(GetBondScreenerYieldSchema.shape).length === 0 ? {} : {yield: GetBondScreenerYieldSchema}),
    ...(Object.keys(GetBondScreenerCouponsSchema.element.shape).length === 0 ? {} : {coupons: GetBondScreenerCouponsSchema}),
    ...(Object.keys(GetBondScreenerOffersSchema.element.shape).length === 0 ? {} : {offers: GetBondScreenerOffersSchema}),
    ...(Object.keys(GetBondScreenerAmortizationsSchema.element.shape).length === 0 ? {} : {amortizations: GetBondScreenerAmortizationsSchema}),
    maturityDate: string(),
    duration: number(),
    durationMacaulay: number(),
    couponRate: number(),
    faceValue: number(),
    currentFaceValue: number(),
    couponType: string(),
    guaranteed: boolean(),
    hasAmortization: boolean(),
    hasOffer: boolean(),
    placementEndDate: string()
  }) as ZodObject<ZodPropertiesOf<GetBondScreenerBond>>;

  type GetBondScreenerEdgeConnection = Modify<
    BondsEdge,
    'node' | 'cursor',
    {
      node: TypeOf<typeof GetBondScreenerBondSchema>;
      cursor: string;
    }
  >;

  const GetBondScreenerEdgeConnectionSchema: ZodObject<ZodPropertiesOf<GetBondScreenerEdgeConnection>> = object({
    node: GetBondScreenerBondSchema,
    cursor: string()
  });

  type GetBondScreenerBondsConnection = Modify<
    BondsConnection,
    'edges',
    {
      edges: TypeOf<typeof GetBondScreenerEdgeConnectionSchema>[];
    }
  >;

  const GetBondScreenerBondsConnectionSchema: ZodObject<ZodPropertiesOf<GetBondScreenerBondsConnection>> = object({
    edges: GetBondScreenerEdgeConnectionSchema.array(),
    pageInfo: PageInfoSchema()
  });

  type GetBondScreenerBondQuery = Modify<
    Query,
    'bonds',
    {
      bonds: TypeOf<typeof GetBondScreenerBondsConnectionSchema>;
    }
  >;

  return object({
    bonds: GetBondScreenerBondsConnectionSchema
  }) as ZodObject<ZodPropertiesOf<GetBondScreenerBondQuery>>;
}
