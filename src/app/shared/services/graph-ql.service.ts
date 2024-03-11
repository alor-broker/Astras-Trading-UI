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
import { TranslatorService } from "./translator.service";
import { InstantNotificationsService } from "./instant-notifications.service";
import { CommonInstantNotificationType } from "../models/terminal-settings/terminal-settings.model";

interface GraphQLError {
  extensions?: {
    code?: string;
  };
}

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
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly translatorService: TranslatorService,
    private readonly notification: InstantNotificationsService
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
            this.errorHandlerService.handleError(err.networkError);
          } else if (err.graphQLErrors.find((err: GraphQLError) => err.extensions?.code === 'AUTH_NOT_AUTHORIZED')) {
            return this.translatorService.getTranslator('bond-screener')
              .pipe(
                map(t => {
                  this.notification.showNotification(
                    CommonInstantNotificationType.Common,
                    'error',
                    t(['authErrorTitle']),
                    t(['authErrorMessage'])
                  );
                  return null;
                })
              );
          } else {
            this.errorHandlerService.handleError(err);
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
