import { Injectable, inject } from '@angular/core';
import { Observable, take } from "rxjs";
import { FetchPolicy, GraphQlService } from "../../../shared/services/graph-ql.service";
import { DefaultTableFilters } from "../../../shared/models/settings/table-settings.model";
import { GraphQlHelper } from "../../../shared/utils/graph-ql-helper";
import { getAllInstrumentsResponseSchema } from "./all-instruments.gql-schemas";
import {
  InstrumentModelFilterInput,
  InstrumentModelSortInput,
  InstrumentsConnection,
  Query,
  QueryInstrumentsArgs
} from "../../../../generated/graphql.types";
import { InstrumentModelFilterInputSchema } from "../../../../generated/graphql.schemas";
import { TypeOf } from "zod";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class AllInstrumentsService {
  private readonly graphQlService = inject(GraphQlService);

  getInstruments(
    columnIds: string[],
    filters: DefaultTableFilters,
    params: { first: number, after?: string | null, sort: InstrumentModelSortInput[] | null }
  ): Observable<InstrumentsConnection | null> {
    const allInstrumentsResponseSchema = getAllInstrumentsResponseSchema(columnIds);
    const parsedFilters = GraphQlHelper.parseToGqlFiltersIntersection<InstrumentModelFilterInput>(filters, InstrumentModelFilterInputSchema());

    const args: QueryInstrumentsArgs = {
      first: params.first,
      after: params.after,
      order: params.sort,
      where: parsedFilters
    };

    return this.graphQlService.queryForSchema<TypeOf<typeof allInstrumentsResponseSchema>>(
      allInstrumentsResponseSchema,
      {
        first: args.first,
        after: args.after,
        where: { value: args.where, type: 'InstrumentModelFilterInput' },
        order: { value: args.order, type: '[InstrumentModelSortInput!]' },
      },
      { fetchPolicy: FetchPolicy.NoCache }
    ).pipe(
      take(1),
      map(q => (q as Query)?.instruments ?? null)
    );
  }
}
