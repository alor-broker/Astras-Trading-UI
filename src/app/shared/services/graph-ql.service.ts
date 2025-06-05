import { Injectable } from '@angular/core';
import {
  Apollo,
  gql
} from "apollo-angular";
import {
  from,
  Observable,
  of
} from "rxjs";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import {
  catchError,
  map
} from "rxjs/operators";
import { GraphQLError } from "graphql";
import { HttpErrorResponse } from "@angular/common/http";
import { ZodObject } from "zod";
import { ZodPropertiesOf } from "../utils/graph-ql/zod-helper";
import {
  GqlQueryBuilder,
  Variables
} from "../utils/graph-ql/gql-query-builder";

export type GraphQlVariables = Record<string, any>;

export enum NamedClients {
  Default = 'default',
  News = 'news'
}

export enum FetchPolicy {
  Default = 'cache-first',
  NoCache = 'no-cache'
}

@Injectable({
  providedIn: 'root'
})
export class GraphQlService {
  constructor(
    private readonly apollo: Apollo,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
  }

  watchQuery<T>(
    query: string,
    variables?: GraphQlVariables,
    options?: {
      fetchPolicy: FetchPolicy;
    }
  ): Observable<T | null> {
    try {
      return this.apollo.watchQuery({
        query: gql<T, GraphQlVariables>`${query}`,
        variables,
        fetchPolicy: options?.fetchPolicy ?? FetchPolicy.Default
      })
        .valueChanges
        .pipe(
          catchError(err => {
            if (err.networkError != null) {
              this.errorHandlerService.handleError(new HttpErrorResponse(err.networkError));
            } else if (err.graphQLErrors?.length > 0) {
              err.graphQLErrors.forEach((e: GraphQLError) => {
                this.errorHandlerService.handleError(new GraphQLError(e.message, e));
              });
            } else {
              this.errorHandlerService.handleError(new GraphQLError(err.message, err));
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

  watchQueryForSchema<TResp>(
    responseSchema: ZodObject<ZodPropertiesOf<TResp>>,
    variables?: Variables,
    options?: {
      fetchPolicy: FetchPolicy;
    }): Observable<TResp | null> {
    const query = GqlQueryBuilder.getQuery(responseSchema, variables);

    return this.watchQuery<TResp>(query.query, query.variables, options);
  }

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
          if (err.networkError != null) {
            this.errorHandlerService.handleError(new HttpErrorResponse(err.networkError));
          } else if (err.graphQLErrors?.length > 0) {
            err.graphQLErrors.forEach((e: GraphQLError) => {
              this.errorHandlerService.handleError(new GraphQLError(e.message, e));
            });
          } else {
            this.errorHandlerService.handleError(new GraphQLError(err.message, err));
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
