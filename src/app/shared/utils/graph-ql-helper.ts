import { DefaultTableFilters } from "../models/settings/table-settings.model";
import {
  AdditionalInformation,
  BasicInformation,
  BoardInformation,
  BooleanOperationFilterInput,
  DateTimeOperationFilterInput,
  DecimalOperationFilterInput,
  FinancialAttributes,
  InputMaybe,
  IntOperationFilterInput,
  StringOperationFilterInput,
  TradingDetails
} from "../../../generated/graphql.types";
import { util, ZodArray, ZodLazy, ZodNullable, ZodObject, ZodOptional, ZodRawShape, ZodTypeAny } from "zod/v3";
import {
  AdditionalInformationSchema,
  BasicInformationSchema,
  BoardInformationSchema,
  BooleanOperationFilterInputSchema,
  DateTimeOperationFilterInputSchema,
  DecimalOperationFilterInputSchema,
  FinancialAttributesSchema,
  IntOperationFilterInputSchema,
  StringOperationFilterInputSchema,
  TradingDetailsSchema
} from "../../../generated/graphql.schemas";
import { ZodPropertiesOf } from "./graph-ql/zod-helper";
import Exactly = util.Exactly;

enum FilterType {
  String = 'string',
  Number = 'number',
  Date = 'date',
  Boolean = 'boolean'
}

enum IntervalModifier {
  From = 'From',
  To = 'To'
}

const DEFAULT_FILTER_KEYS = [
  'and',
  'or',
  'contains',
  'endsWith',
  'eq',
  'in',
  'ncontains',
  'nendsWith',
  'neq',
  'nin',
  'nstartsWith',
  'startsWith',
  'gt',
  'gte',
  'lt',
  'lte',
  'ngt',
  'ngte',
  'nlt',
  'nlte',
  'none',
  'all',
  'any',
  'some'
];

const DECIMAL_FILTER_SCHEMA_STRING = JSON.stringify(DecimalOperationFilterInputSchema().shape);
const INT_FILTER_SCHEMA_STRING = JSON.stringify(IntOperationFilterInputSchema().shape);
const STRING_FILTER_SCHEMA_STRING = JSON.stringify(StringOperationFilterInputSchema().shape);
const BOOLEAN_FILTER_SCHEMA_STRING = JSON.stringify(BooleanOperationFilterInputSchema().shape);
const DATE_FILTER_SCHEMA_STRING = JSON.stringify(DateTimeOperationFilterInputSchema().shape);

export class GraphQlHelper {
  static getPartialSchema<T>(
    schema: ZodObject<ZodPropertiesOf<T>>,
    keysToInclude: string[],
    requiredKeys: string[] = [],
    keyWord = ''
  ): ZodObject<ZodPropertiesOf<T>> {
    return schema.pick(
      Object.keys(schema.shape)
        .filter((key) =>
          requiredKeys.includes(key) ||
          keysToInclude
            .filter(c => c.startsWith(keyWord))
            .map(c => c.replace(keyWord, '').toLowerCase())
            .includes(key.toLowerCase())
        )
        .reduce((prev, curr) => {
          prev[curr] = true;
          return prev as { [key in keyof T]: true };
        }, {} as Exactly<any, { [key in keyof T]: true }>)
    );
  }

  static getBasicInformationPartialSchema(keysToInclude: string[]): ZodObject<ZodPropertiesOf<BasicInformation>> {
    return this.getPartialSchema<BasicInformation>(BasicInformationSchema(), keysToInclude, ['symbol', 'exchange']);
  }

  static getAdditionalInformationSchema(keysToInclude: string[]): ZodObject<ZodPropertiesOf<AdditionalInformation>> {
    return this.getPartialSchema<AdditionalInformation>(AdditionalInformationSchema(), keysToInclude);
  }

  static getFinancialAttributesSchema(keysToInclude: string[]): ZodObject<ZodPropertiesOf<FinancialAttributes>> {
    return this.getPartialSchema<FinancialAttributes>(FinancialAttributesSchema(), keysToInclude);
  }

  static getBoardInformationSchema(keysToInclude: string[]): ZodObject<ZodPropertiesOf<BoardInformation>> {
    return this.getPartialSchema<BoardInformation>(BoardInformationSchema(), keysToInclude);
  }

  static getTradingDetailsSchema(keysToInclude: string[]): ZodObject<ZodPropertiesOf<TradingDetails>> {
    return this.getPartialSchema<TradingDetails>(TradingDetailsSchema(), keysToInclude);
  }

  static parseToGqlFiltersIntersection<T extends { and?: InputMaybe<T[]> }>(filters: DefaultTableFilters, schema: ZodObject<ZodRawShape>): T {
    const schemaKeys = this.zodKeys(schema);

    const reqFilters = Object.keys(filters)
      .map(f => {
        const foundFilter = schemaKeys.find(pf => {
          const nestedFields = pf.split('.');
          const filterName = nestedFields[nestedFields.length - 1].split('/')[0];

          return filterName === f ||
            filterName === f.replace(IntervalModifier.From, '') ||
            filterName === f.replace(IntervalModifier.To, '');
        });

        return { graphQlFilter: foundFilter, tableFilterKey: f };
      })
      .filter(fi => fi.graphQlFilter != null)
      .map(fi => this.getGraphQlFilter<T>(
        fi.tableFilterKey,
        filters[fi.tableFilterKey] as string | string[] | number | boolean,
        fi.graphQlFilter!
      ));

    return { and: reqFilters } as T;
  }

  // get zod object keys recursively
  static getZodObject(schema: ZodTypeAny): ZodObject<any> | null {
    if (schema === null || schema === undefined) return null;
    if (schema instanceof ZodLazy) return this.getZodObject(schema.schema);
    if (schema instanceof ZodNullable || schema instanceof ZodOptional) return this.getZodObject(schema.unwrap());
    if (schema instanceof ZodArray) return this.getZodObject(schema.element);
    if (schema instanceof ZodObject) {
      return schema;
    }
    return null;
  };

  private static zodKeys(schema: ZodTypeAny): string[] {
    const zodObj = this.getZodObject(schema);

    if (zodObj == null) {
      return [];
    }

    // get key/value pairs from schema
    const entries = Object.entries(zodObj.shape);
    // loop through key/value pairs
    return entries
      .filter(([key]) => !DEFAULT_FILTER_KEYS.includes(key))
      .flatMap(([key, value]) => {
        // get nested keys
        const nested = (this.zodKeys(value as ZodTypeAny) ?? []).map(subKey => `${key}.${subKey}`);
        return nested.length ? nested : `${key}/${this.getFilterType(this.getZodObject(value as ZodTypeAny)?.shape ?? {})}`;
      });
  };

  private static getFilterType(shape: ZodRawShape): FilterType {
    switch (JSON.stringify(shape)) {
      case DECIMAL_FILTER_SCHEMA_STRING:
      case INT_FILTER_SCHEMA_STRING:
        return FilterType.Number;
      case STRING_FILTER_SCHEMA_STRING:
        return FilterType.String;
      case BOOLEAN_FILTER_SCHEMA_STRING:
        return FilterType.Boolean;
      case DATE_FILTER_SCHEMA_STRING:
        return FilterType.Date;
      default:
        return FilterType.String;
    }
  }

  private static getGraphQlFilter<T>(
    tableFilterName: string,
    tableFilterValue: string | string[] | number | boolean,
    graphQlFilter: string
    ): T {
    const filterType = graphQlFilter.split('/')[1] as FilterType;
    const nestedFilterKeys = graphQlFilter.split('/')[0].split('.');

    const intervalModifier = tableFilterName.endsWith(IntervalModifier.From)
      ? IntervalModifier.From
      : tableFilterName.endsWith(IntervalModifier.To)
        ? IntervalModifier.To
        : null;

    return nestedFilterKeys.reverse().reduce(
      (acc, curr, index) => {
        if (Array.isArray(tableFilterValue) && index === 0) {
          return {
            or: tableFilterValue.map(v => ({ [curr]: { eq: v } }))
          };
        }
        return { [curr]: acc };
      },
      this.getGraphQlFilterValue(filterType, tableFilterValue, intervalModifier)
    ) as T;
  }

  private static getGraphQlFilterValue(
    filterType: FilterType,
    filterValue: string | string[] | number | boolean,
    intervalModifier: IntervalModifier | null
    ): DecimalOperationFilterInput | DateTimeOperationFilterInput | BooleanOperationFilterInput | StringOperationFilterInput | IntOperationFilterInput | null {
    const conditionKey = intervalModifier == null
      ? 'eq'
      : intervalModifier === IntervalModifier.From
        ? 'gte'
        : 'lte';

    switch (filterType) {
      case FilterType.String:
        return { contains:  filterValue as string };
      case FilterType.Number:
        return { [conditionKey]: Number(filterValue as number) };
      case FilterType.Date:
        const [day, month, year] = (filterValue as string).split('.').map(d => +d);
        const filterDate = new Date(year, month - 1, day);

        if (isNaN(filterDate.getTime())) {
          return null;
        }

        const parsedDate = filterDate.toISOString();

        return { [conditionKey]: parsedDate };
      case FilterType.Boolean:
        return { eq: filterValue as boolean };
    }
  }
}
