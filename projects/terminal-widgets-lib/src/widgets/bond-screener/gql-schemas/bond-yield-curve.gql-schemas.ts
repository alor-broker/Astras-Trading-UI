import {
  Modify,
  ZodPropertiesOf
} from "@terminal-core-lib/features/graphql/utils/zod-types.helper";
import {
  number,
  object,
  string,
  TypeOf,
  ZodObject
} from "zod/v3";
import {
  Bond,
  BondsConnection,
  BondYield,
  Query
} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';
import {
  BasicInformationSchema,
  BondYieldSchema
} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.schemas';

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
