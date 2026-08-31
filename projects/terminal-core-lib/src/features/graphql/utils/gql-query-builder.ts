import {ZodPropertiesOf} from './zod-types.helper';
import {ZodObject} from 'zod/v3';
import {GqlFieldsExtractor} from './gql-fields-extractor';
import * as queryBuilder from 'gql-query-builder';
import {VariableOptions} from 'gql-query-builder';

export type Variables = VariableOptions;

export class GqlQueryBuilder {
  static getQuery<TResp>(
    responseSchema: ZodObject<ZodPropertiesOf<TResp>>,
    variables?: Variables
  ): { query: string, variables: Record<string, unknown> } {
    const operation = GqlFieldsExtractor.getOperation(responseSchema);
    const fields = GqlFieldsExtractor.getFields(responseSchema, operation);

    return queryBuilder.query(
      {
        operation,
        fields,
        variables
      }
    ) as { query: string, variables: Record<string, unknown> };
  }
}
