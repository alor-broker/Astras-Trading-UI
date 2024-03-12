import { Injectable } from '@angular/core';
import {
  Apollo,
  gql
} from "apollo-angular";
import {
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

export interface GraphQlVariables {
  [propName: string]: any;
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
}
