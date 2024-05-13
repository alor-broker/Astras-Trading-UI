import VariableOptions from "gql-query-builder/build/VariableOptions";
import { ZodObject } from "zod";
import { GqlFieldsExtractor } from "./gql-fields-extractor";
import * as queryBuilder from 'gql-query-builder';
import { ZodPropertiesOf } from "./zod-helper";

export type Variables = VariableOptions;

export class GqlQueryBuilder {
  static getQuery<TResp>(
    responseSchema: ZodObject<ZodPropertiesOf<TResp>>,
    variables?: Variables
  ): { query: string, variables: any } {
    const operation = GqlFieldsExtractor.getOperation(responseSchema);
    const fields = GqlFieldsExtractor.getFields(responseSchema, operation);

    return queryBuilder.query(
      {
        operation,
        fields,
        variables
      }
    );
  }
}
