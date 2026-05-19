import {
  inject,
  Injectable
} from '@angular/core';
import {
  Apollo,
  gql
} from 'apollo-angular';
import {ZodObject} from 'zod/v3';
import {ZodPropertiesOf} from '../utils/zod-types.helper';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {ApplicationStatusService} from '../../../common/services/application-status.service';
import {
  catchError,
  from,
  map,
  Observable,
  of
} from 'rxjs';
import {
  GqlQueryBuilder,
  Variables
} from '../utils/gql-query-builder';
import {HttpErrorResponse} from '@angular/common/http';
import {GraphQLError} from 'graphql/error';

export type GraphQlVariables = Record<string, any>;

export enum NamedClients {
  Default = 'default',
  News = 'news'
}

export enum FetchPolicy {
  Default = 'cache-first',
  NoCache = 'no-cache'
}

@Injectable()
export class GraphQlService {
  private readonly apollo = inject(Apollo);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  queryForSchema<TResp>(
    responseSchema: ZodObject<ZodPropertiesOf<TResp>>,
    variables?: Variables,
    options?: {
      clientName?: NamedClients;
      fetchPolicy?: FetchPolicy;
    }
  ): Observable<TResp | null> {
    const client = options?.clientName != null
      ? this.apollo.use(options.clientName)
      : this.apollo.default();

    const query = GqlQueryBuilder.getQuery(responseSchema, variables);

    try {
      return from(client.query(
        {
          query: gql<TResp, GraphQlVariables>`${query.query}`,
          variables: query.variables as GraphQlVariables,
          fetchPolicy: options?.fetchPolicy ?? FetchPolicy.NoCache,
          errorPolicy: "none"
        }
      )).pipe(
        catchError(err => {
          if (this.applicationStatusService.isActive) {
            if (err.networkError != null) {
              this.errorHandlerService.handleError(new HttpErrorResponse(err.networkError));
            } else if (err.graphQLErrors?.length > 0) {
              err.graphQLErrors.forEach((e: GraphQLError) => {
                this.errorHandlerService.handleError(new GraphQLError(e.message, e));
              });
            } else {
              this.errorHandlerService.handleError(new GraphQLError(err.message, err));
            }
          }

          return of(null);
        }),
        map((res) => res?.data ?? null)
      );
    } catch (err) { // In case of query parsing error
      this.errorHandlerService.handleError(err as Error);
      return of(null);
    }
  }
}
