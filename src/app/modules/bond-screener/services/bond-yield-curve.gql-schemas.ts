import {
  BasicInformationSchema,
  BondYieldSchema,
} from "../../../../generated/graphql.schemas";
import {
  Modify,
  ZodPropertiesOf
} from "../../../shared/utils/graph-ql/zod-helper";
import {
  Bond,
  BondsConnection,
  BondYield,
  Query
} from "../../../../generated/graphql.types";
import {
  number,
  object,
  string,
  TypeOf,
  ZodObject
} from "zod/v3";

const GetBondsYieldCurveBasicInformationSchema = BasicInformationSchema().pick({
  symbol: true,
  exchange: true,
  shortName: true
});

type GetBondsYieldCurveBond = Modify<
  Bond,
  'basicInformation' | 'maturityDate' | 'duration' | 'durationMacaulay' | 'yield',
  {
    basicInformation: TypeOf<typeof GetBondsYieldCurveBasicInformationSchema>;
    maturityDate: string;
    duration: number;
    durationMacaulay: number;
    yield: BondYield;
  }
>;

const GetBondsYieldCurveBondSchema: ZodObject<ZodPropertiesOf<GetBondsYieldCurveBond>> = object({
  basicInformation: GetBondsYieldCurveBasicInformationSchema,
  maturityDate: string(),
  duration: number(),
  durationMacaulay: number(),
  yield: BondYieldSchema(),
});

type GetBondsYieldCurveBondsConnection = Modify<
  BondsConnection,
  'nodes',
  {
    nodes: TypeOf<typeof GetBondsYieldCurveBondSchema>[];
  }
>;

const GetBondsYieldCurveBondsConnectionSchema: ZodObject<ZodPropertiesOf<GetBondsYieldCurveBondsConnection>> = object({
  nodes: GetBondsYieldCurveBondSchema.array()
});

type GetBondsYieldCurveBondQuery = Modify<
  Query,
  'bonds',
  {
    bonds: TypeOf<typeof GetBondsYieldCurveBondsConnectionSchema>;
  }
>;

export const GetBondsYieldCurveResponseSchema: ZodObject<ZodPropertiesOf<GetBondsYieldCurveBondQuery>> = object({
  bonds: GetBondsYieldCurveBondsConnectionSchema
});

export type GetBondsYieldCurveResponse = TypeOf<typeof GetBondsYieldCurveResponseSchema>;
