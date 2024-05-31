import {
  AdditionalInformationSchema,
  BasicInformationSchema,
  BoardInformationSchema,
  CurrencyInformationSchema,
  FinancialAttributesSchema, PageInfoSchema,
  TradingDetailsSchema
} from "../../../../generated/graphql.schemas";
import {
  Modify,
  ZodPropertiesOf
} from "../../../shared/utils/graph-ql/zod-helper";
import {
  AdditionalInformation,
  BasicInformation,
  BoardInformation,
  CurrencyInformation,
  FinancialAttributes,
  Instrument,
  InstrumentsConnection,
  InstrumentsEdge,
  Query,
  TradingDetails
} from "../../../../generated/graphql.types";
import {
  object,
  string,
  TypeOf,
  util,
  ZodObject
} from "zod";
import Exactly = util.Exactly;

export function getAllInstrumentsResponseSchema(columnIds: string[]): ZodObject<ZodPropertiesOf<unknown>> {
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

  const GetAllInstrumentsBasicInformationSchema = getPartialSchema<BasicInformation>(BasicInformationSchema(), ['symbol', 'exchange']);
  const GetAllInstrumentsAdditionalInformationSchema = getPartialSchema<AdditionalInformation>(AdditionalInformationSchema());
  const GetAllInstrumentsFinancialAttributesSchema = getPartialSchema<FinancialAttributes>(FinancialAttributesSchema());
  const GetAllInstrumentsBoardInformationSchema = getPartialSchema<BoardInformation>(BoardInformationSchema());
  const GetAllInstrumentsCurrencyInformationSchema = getPartialSchema<CurrencyInformation>(CurrencyInformationSchema());
  const GetAllInstrumentsTradingDetailsSchema = getPartialSchema<TradingDetails>(TradingDetailsSchema());

  type GetAllInstrumentsInstrument = Modify<
    Instrument,
    'basicInformation' |
    'additionalInformation' |
    'financialAttributes' |
    'boardInformation' |
    'tradingDetails' |
    'currencyInformation',
    {
      basicInformation: TypeOf<typeof GetAllInstrumentsBasicInformationSchema>;
      additionalInformation: TypeOf<typeof GetAllInstrumentsAdditionalInformationSchema>;
      financialAttributes: TypeOf<typeof GetAllInstrumentsFinancialAttributesSchema>;
      boardInformation: TypeOf<typeof GetAllInstrumentsBoardInformationSchema>;
      currencyInformation: TypeOf<typeof GetAllInstrumentsCurrencyInformationSchema>;
      tradingDetails: TypeOf<typeof GetAllInstrumentsTradingDetailsSchema>;
    }
    >;

  const GetAllInstrumentsInstrumentSchema: ZodObject<ZodPropertiesOf<GetAllInstrumentsInstrument>> = object({
    basicInformation: GetAllInstrumentsBasicInformationSchema,
    ...(Object.keys(GetAllInstrumentsAdditionalInformationSchema.shape).length === 0 ? {} : {additionalInformation: GetAllInstrumentsAdditionalInformationSchema}),
    ...(Object.keys(GetAllInstrumentsFinancialAttributesSchema.shape).length === 0 ? {} : {financialAttributes: GetAllInstrumentsFinancialAttributesSchema}),
    ...(Object.keys(GetAllInstrumentsBoardInformationSchema.shape).length === 0 ? {} : {boardInformation: GetAllInstrumentsBoardInformationSchema}),
    ...(Object.keys(GetAllInstrumentsCurrencyInformationSchema.shape).length === 0 ? {} : {currencyInformation: GetAllInstrumentsCurrencyInformationSchema}),
    ...(Object.keys(GetAllInstrumentsTradingDetailsSchema.shape).length === 0 ? {} : {tradingDetails: GetAllInstrumentsTradingDetailsSchema}),
  }) as ZodObject<ZodPropertiesOf<GetAllInstrumentsInstrument>>;

  type GetAllInstrumentsEdgeConnection = Modify<
    InstrumentsEdge,
    'node' | 'cursor',
    {
      node: TypeOf<typeof GetAllInstrumentsInstrumentSchema>;
      cursor: string;
    }
    >;

  const GetAllInstrumentsEdgeConnectionSchema: ZodObject<ZodPropertiesOf<GetAllInstrumentsEdgeConnection>> = object({
    node: GetAllInstrumentsInstrumentSchema,
    cursor: string()
  });

  type GetAllInstrumentsInstrumentsConnection = Modify<
    InstrumentsConnection,
    'edges',
    {
      edges: TypeOf<typeof GetAllInstrumentsEdgeConnectionSchema>[];
    }
    >;

  const GetAllInstrumentsInstrumentsConnectionSchema: ZodObject<ZodPropertiesOf<GetAllInstrumentsInstrumentsConnection>> = object({
    edges: GetAllInstrumentsEdgeConnectionSchema.array(),
    pageInfo: PageInfoSchema()
  });

  type GetAllInstrumentsInstrumentsQuery = Modify<
    Query,
    'instruments',
    {
      instruments: TypeOf<typeof GetAllInstrumentsInstrumentsConnectionSchema>;
    }
    >;

  return object({
    instruments: GetAllInstrumentsInstrumentsConnectionSchema
  }) as ZodObject<ZodPropertiesOf<GetAllInstrumentsInstrumentsQuery>>;

}
