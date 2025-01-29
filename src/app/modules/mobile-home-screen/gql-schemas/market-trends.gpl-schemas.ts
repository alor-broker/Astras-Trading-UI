import {
  BasicInformationSchema,
  BoardInformationSchema, FinancialAttributesSchema, TradingDetailsSchema
} from "../../../../generated/graphql.schemas";
import {
  Modify,
  ZodPropertiesOf
} from "../../../shared/utils/graph-ql/zod-helper";
import {
  FinancialAttributes,
  Instrument,
  InstrumentsConnection,
  Query, TradingDetails
} from "../../../../generated/graphql.types";
import {
  number,
  object,
  TypeOf,
  ZodObject
} from "zod";

const basicInfoScheme = BasicInformationSchema().pick({
  symbol: true,
  exchange: true,
  shortName: true,
  market: true
});

const boardInfoScheme = BoardInformationSchema().pick({
  board: true
});

export type InstrumentInfoType = Modify<
  Instrument,
  'basicInformation' | 'boardInformation' | 'tradingDetails' | 'financialAttributes',
  {
    basicInformation: TypeOf<typeof basicInfoScheme>;
    boardInformation: TypeOf<typeof boardInfoScheme>;
    tradingDetails: TradingDetails;
    financialAttributes: FinancialAttributes;
  }
>;

const InstrumentInfoScheme: ZodObject<ZodPropertiesOf<InstrumentInfoType>> = object({
  basicInformation: basicInfoScheme,
  boardInformation: boardInfoScheme,
  tradingDetails: TradingDetailsSchema(),
  financialAttributes: FinancialAttributesSchema()
});

export type MarketTrendsInstrumentsConnectionType = Modify<
  InstrumentsConnection,
  'nodes' | 'totalCount',
  {
    nodes: TypeOf<typeof InstrumentInfoScheme>[];
    totalCount: number;
  }
>;

const InstrumentsConnectionScheme: ZodObject<ZodPropertiesOf<MarketTrendsInstrumentsConnectionType>> = object({
  nodes: InstrumentInfoScheme.array(),
  totalCount: number()
});

type InstrumentsSearchQueryType = Modify<
  Query,
  'instruments',
  {
    instruments: TypeOf<typeof InstrumentsConnectionScheme>;
  }
>;

export const MarketTrendsResponseScheme: ZodObject<ZodPropertiesOf<InstrumentsSearchQueryType>> = object({
  instruments: InstrumentsConnectionScheme
});

export type MarketTrendsResponse = TypeOf<typeof MarketTrendsResponseScheme>;
