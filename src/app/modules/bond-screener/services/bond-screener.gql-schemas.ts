import {
  AdditionalInformationSchema,
  BasicInformationSchema,
  BoardInformationSchema,
  BondVolumesSchema,
  BondYieldSchema,
  CouponSchema,
  FinancialAttributesSchema,
  OfferSchema,
  PageInfoSchema,
  TradingDetailsSchema,
} from "../../../../generated/graphql.schemas";
import {
  Modify,
  ZodPropertiesOf
} from "../../../shared/utils/graph-ql/zod-helper";
import {
  AdditionalInformation,
  BasicInformation,
  BoardInformation,
  Bond,
  BondsConnection,
  BondsEdge,
  BondVolumes,
  BondYield,
  Coupon,
  FinancialAttributes,
  Offer,
  Query,
  TradingDetails
} from "../../../../generated/graphql.types";
import {
  boolean,
  number,
  object,
  string,
  TypeOf,
  util,
  ZodObject
} from "zod";
import Exactly = util.Exactly;

export function getBondScreenerResponseSchema(columnIds: string[]): ZodObject<ZodPropertiesOf<unknown>> {
  const getPartialSchema = <T>(
    schema: ZodObject<ZodPropertiesOf<T>>,
    requiredKeys: string[] = [],
    keyWord = ''
  ): ZodObject<ZodPropertiesOf<T>> => {
    return schema.pick(
      Object.keys(schema.shape)
        .filter((key) =>
          requiredKeys.includes(key) ||
          columnIds
            .filter(c => c.startsWith(keyWord))
            .map(c => c.replace(keyWord, '').toLowerCase())
            .includes(key.toLowerCase())
        )
        .reduce((prev, curr) => {
          prev[curr] = true;
          return prev as { [key in keyof T]: true };
        }, {} as Exactly<any, { [key in keyof T]: true }>)
    );
  };

  const GetBondScreenerBasicInformationSchema = getPartialSchema<BasicInformation>(BasicInformationSchema(), ['symbol', 'exchange']);
  const GetBondScreenerAdditionalInformationSchema = getPartialSchema<AdditionalInformation>(AdditionalInformationSchema());
  const GetBondScreenerFinancialAttributesSchema = getPartialSchema<FinancialAttributes>(FinancialAttributesSchema());
  const GetBondScreenerBoardInformationSchema = getPartialSchema<BoardInformation>(BoardInformationSchema());
  const GetBondScreenerTradingDetailsSchema = getPartialSchema<TradingDetails>(TradingDetailsSchema());
  const GetBondScreenerVolumesSchema = getPartialSchema<BondVolumes>(BondVolumesSchema());
  const GetBondScreenerYieldSchema = getPartialSchema<BondYield>(BondYieldSchema());
  const GetBondScreenerCouponsSchema = getPartialSchema<Coupon>(CouponSchema(), ['date'], 'coupon').array();
  const GetBondScreenerOffersSchema = getPartialSchema<Offer>(OfferSchema(), ['date'], 'offer').array();
  const GetBondScreenerAmortizationsSchema = getPartialSchema<Offer>(OfferSchema(), ['date']).array();

  type GetBondScreenerBond = Modify<
    Bond,
    'basicInformation' |
    'additionalInformation' |
    'financialAttributes' |
    'boardInformation' |
    'tradingDetails' |
    'volumes' |
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
    couponType: string(),
    guaranteed: boolean(),
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
