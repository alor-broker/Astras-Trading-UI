import {
  CurrencyInformationSchema,
  PageInfoSchema,
} from "../../../../generated/graphql.schemas";
import {
  Modify,
  ZodPropertiesOf
} from "../../../shared/utils/graph-ql/zod-helper";
import {
  CurrencyInformation,
  Instrument,
  InstrumentsConnection,
  InstrumentsEdge,
  Query
} from "../../../../generated/graphql.types";
import {
  object,
  string,
  TypeOf,
  ZodObject
} from "zod/v3";
import { GraphQlHelper } from "../../../shared/utils/graph-ql-helper";

export function getAllInstrumentsResponseSchema(columnIds: string[]): ZodObject<ZodPropertiesOf<unknown>> {
  const GetAllInstrumentsBasicInformationSchema = GraphQlHelper.getBasicInformationPartialSchema(columnIds);
  const GetAllInstrumentsAdditionalInformationSchema = GraphQlHelper.getAdditionalInformationSchema(columnIds);
  const GetAllInstrumentsFinancialAttributesSchema = GraphQlHelper.getFinancialAttributesSchema(columnIds);
  const GetAllInstrumentsBoardInformationSchema = GraphQlHelper.getBoardInformationSchema(columnIds);
  const GetAllInstrumentsCurrencyInformationSchema = GraphQlHelper.getPartialSchema<CurrencyInformation>(CurrencyInformationSchema(), columnIds);
  const GetAllInstrumentsTradingDetailsSchema = GraphQlHelper.getTradingDetailsSchema(columnIds);

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
