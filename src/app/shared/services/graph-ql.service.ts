import { Injectable } from '@angular/core';
import { Apollo, gql } from "apollo-angular";
import { Observable, of } from "rxjs";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { catchError, map } from "rxjs/operators";

export interface GraphQlVariables {
  [propName: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class GraphQlService {

  constructor(
    private readonly apollo: Apollo,
    private readonly errorHandlerService: ErrorHandlerService
  ) { }

  watchQuery<T>(query: string, variables: GraphQlVariables): Observable<T | null> {
    try {
      return this.apollo.watchQuery({
        query: gql<T, GraphQlVariables>`${query}`,
        variables
      })
        .valueChanges
        .pipe(
          catchError(err => {
            if (err.networkError != null) {
              this.errorHandlerService.handleError(err.networkError);
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
