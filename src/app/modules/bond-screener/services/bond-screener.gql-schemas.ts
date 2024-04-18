import {
  BasicInformationSchema,
  BondYieldSchema,
  PageInfoSchema
} from "../../../../generated/graphql.schemas";
import {
  Modify,
  ZodDefinition
} from "../../../shared/utils/graph-ql/zod-helper";
import {
  Bond,
  BondsConnection,
  Query
} from "../../../../generated/graphql.types";
import {
  number,
  object,
  string,
  TypeOf
} from "zod";

const GetBondsYieldCurveBasicInformationSchema = BasicInformationSchema().pick({
  symbol: true,
  exchange: true,
  shortName: true
});

type GetBondsYieldCurveBond = Modify<Bond, {
  basicInformation: TypeOf<typeof GetBondsYieldCurveBasicInformationSchema>;
}>;


const GetBondsYieldCurveBondSchema: ZodDefinition<GetBondsYieldCurveBond, 'basicInformation' | 'maturityDate' | 'duration' | 'durationMacaulay' | 'yield'> = object({
  basicInformation: GetBondsYieldCurveBasicInformationSchema,
  maturityDate: string(),
  duration: number(),
  durationMacaulay: number(),
  yield: BondYieldSchema(),
});


const GetBondsYieldCurveBondsConnectionSchema: ZodDefinition<BondsConnection, 'nodes' | 'pageInfo' | 'totalCount'> = object({
  nodes: GetBondsYieldCurveBondSchema.array(),
  pageInfo: PageInfoSchema(),
  totalCount: number()
});

export const GetBondsYieldCurveResponseSchema: ZodDefinition<Query, 'bonds'> = object({
  bonds: GetBondsYieldCurveBondsConnectionSchema
});
