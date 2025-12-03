import {
  BasicInformationSchema,
  BoardInformationSchema
} from "../../../../generated/graphql.schemas";
import {
  Modify,
  ZodPropertiesOf
} from "../../../shared/utils/graph-ql/zod-helper";
import {
  Instrument,
  InstrumentsConnection,
  Query
} from "../../../../generated/graphql.types";
import {
  object,
  TypeOf,
  ZodObject
} from "zod/v3";

const basicInfoScheme = BasicInformationSchema().pick({
  symbol: true,
  exchange: true,
  shortName: true,
  market: true
});

const boardInfoScheme = BoardInformationSchema().pick({
  board: true
});

type InstrumentInfoType = Modify<
  Instrument,
  'basicInformation' | 'boardInformation',
  {
    basicInformation: TypeOf<typeof basicInfoScheme>;
    boardInformation: TypeOf<typeof boardInfoScheme>;
  }
>;

const InstrumentInfoScheme: ZodObject<ZodPropertiesOf<InstrumentInfoType>> = object({
  basicInformation: basicInfoScheme,
  boardInformation: boardInfoScheme
});

type InstrumentsConnectionType = Modify<
  InstrumentsConnection,
  'nodes',
  {
    nodes: TypeOf<typeof InstrumentInfoScheme>[];
  }
>;

const InstrumentsConnectionScheme: ZodObject<ZodPropertiesOf<InstrumentsConnectionType>> = object({
  nodes: InstrumentInfoScheme.array()
});

type InstrumentsSearchQueryType = Modify<
  Query,
  'instruments',
  {
    instruments: TypeOf<typeof InstrumentsConnectionScheme>;
  }
>;

export const InstrumentsSearchResponseScheme: ZodObject<ZodPropertiesOf<InstrumentsSearchQueryType>> = object({
  instruments: InstrumentsConnectionScheme
});

export type InstrumentsSearchResponse = TypeOf<typeof InstrumentsSearchResponseScheme>;
