import {
  inject,
  Injectable
} from '@angular/core';
import {
  Observable,
  take
} from "rxjs";
import {TypeOf} from "zod";
import {map} from "rxjs/operators";
import {
  FetchPolicy,
  GraphQlService
} from '@terminal-core-lib/features/graphql/services/graph-ql.service';
import {DefaultTableFilters} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {
  InstrumentModelFilterInput,
  InstrumentModelSortInput,
  InstrumentsConnection,
  Query,
  QueryInstrumentsArgs
} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';
import {getAllInstrumentsResponseSchema} from '@terminal-widgets-lib/widgets/all-instruments/gql-schemas/all-instruments.gql-schemas';
import {InstrumentModelFilterInputSchema} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.schemas';
import {InstrumentsGraphQlHelper} from '@terminal-core-lib/features/instruments/utils/instruments-graph-ql.helper';

@Injectable()
export class AllInstrumentsService {
  private readonly graphQlService = inject(GraphQlService);

  getInstruments(
    columnIds: string[],
    filters: DefaultTableFilters,
    params: { first: number, after?: string | null, sort: InstrumentModelSortInput[] | null }
  ): Observable<InstrumentsConnection | null> {
    const allInstrumentsResponseSchema = getAllInstrumentsResponseSchema(columnIds);
    const parsedFilters = InstrumentsGraphQlHelper.parseToGqlFiltersIntersection<InstrumentModelFilterInput>(filters, InstrumentModelFilterInputSchema());

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
        where: {value: args.where, type: 'InstrumentModelFilterInput'},
        order: {value: args.order, type: '[InstrumentModelSortInput!]'},
      },
      {fetchPolicy: FetchPolicy.NoCache}
    ).pipe(
      take(1),
      map(q => (q as Query)?.instruments ?? null)
    );
  }
}
