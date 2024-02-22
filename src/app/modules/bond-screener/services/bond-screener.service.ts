import { Injectable } from '@angular/core';
import { Apollo, gql, SubscriptionResult } from "apollo-angular";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { BondScreenerResponse } from "../models/bond-screener.model";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { catchHttpError } from "../../../shared/utils/observable-helper";

@Injectable({
  providedIn: 'root'
})
export class BondScreenerService {

  constructor(
    private readonly apollo: Apollo,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
  }

  getBonds(req: string, variables: { [propName: string]: any }): Observable<BondScreenerResponse> {
    return this.apollo.watchQuery({
      query: gql<BondScreenerResponse, { [propName: string]: any }>`${req}`,
      variables
    }).valueChanges
      .pipe(
        catchError(err => throwError(err.networkError)),
        catchHttpError({
            data: {
              bonds: {
                edges: [],
                pageInfo: {
                  endCursor: '',
                  hasNextPage: false
                }
              }
            }
          } as SubscriptionResult<BondScreenerResponse>,
          this.errorHandlerService
        ),
        map((res) => res.data!)
      );
  }
}
