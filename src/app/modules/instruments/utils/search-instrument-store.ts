import {
  Exchange,
  InstrumentModelFilterInput,
  Market,
  QueryInstrumentsArgs,
  SortEnumType
} from "../../../../generated/graphql.types";
import { ComponentStore } from "@ngrx/component-store";
import { Injectable } from "@angular/core";
import {
  FetchPolicy,
  GraphQlService
} from "../../../shared/services/graph-ql.service";
import {
  Observable,
  switchMap,
  tap
} from "rxjs";
import { StringHelper } from "../../../shared/utils/string-helper";
import {
  InstrumentsSearchResponse,
  InstrumentsSearchResponseScheme
} from "../gql-schemas/search-instruments.gpl-schemas";

export interface SearchFilters {
  instrumentName: string;
  exchange: Exchange | null;
  board: string | null;
}

export enum SearchStatus {
  Initial = 'initial',
  Loading = 'loading',
  Success = 'success',
  Failed = 'failed'
}

export interface SearchResultItem {
  symbol: string;
  shortName: string;
  exchange: Exchange;
  board: string;
  market: Market;
}

export interface SearchInstrumentState {
  filters: SearchFilters | null;
  status: SearchStatus;
  results: SearchResultItem[] | null;
}

@Injectable()
export class SearchInstrumentStore extends ComponentStore<SearchInstrumentState> {
  readonly searchByFilters = this.effect((filters$: Observable<SearchFilters>) => {
    return filters$.pipe(
      tap(filters => {
        this.setState({
          status: SearchStatus.Loading,
          filters,
          results: null
        });
      }),
      switchMap(filters => {
        const args: QueryInstrumentsArgs = {
          first: 50,
          includeNonBaseBoards: filters.board != null,
          where: this.getQueryCondition(filters),
          order: [
            {
              basicInformation: {
                symbol: SortEnumType.Asc
              }
            },
            {
              basicInformation: {
                exchange: SortEnumType.Asc
              }
            }
          ]
        };

        return this.graphQlService.queryForSchema<InstrumentsSearchResponse>(
          InstrumentsSearchResponseScheme,
          {
            first: args.first,
            where: {value: args.where, type: 'InstrumentModelFilterInput'},
            order: {value: args.order, type: '[InstrumentModelSortInput!]'},
          },
          {fetchPolicy: FetchPolicy.NoCache}
        );
      }),
      tap(r => {
        if (r == null) {
          this.patchState({
            status: SearchStatus.Failed
          });

          return;
        }

        this.patchState({
          status: SearchStatus.Success,
          results: r.instruments.nodes.map(i => ({
            symbol: i.basicInformation.symbol,
            shortName: i.basicInformation.shortName,
            exchange: i.basicInformation.exchange,
            board: i.boardInformation.board,
            market: i.basicInformation.market,
          }))
        });
      })
    );
  });

  constructor(
    private readonly graphQlService: GraphQlService,
  ) {
    super({
      status: SearchStatus.Initial,
      filters: null,
      results: null
    });
  }

  private getQueryCondition(filters: SearchFilters): InstrumentModelFilterInput {
    const where: InstrumentModelFilterInput = {
      and: [
        {
          or: [
            {
              basicInformation: {
                or: [
                  {
                    symbol: {
                      startsWith: filters.instrumentName!.toUpperCase()
                    }
                  },
                  {
                    shortName: {
                      startsWith: StringHelper.getPascalCase(filters.instrumentName!)
                    }
                  }
                ]
              }
            },
            /*
            {
              financialAttributes: {
                isin: {
                  eq: filters.instrumentName
                }
              }
            }
            */
          ]
        }
      ]
    };

    if (filters.exchange != null) {
      where.and!.push({
        basicInformation: {
          exchange: {
            eq: filters.exchange
          }
        }
      });
    }

    if (filters.board != null) {
      where.and!.push({
        boardInformation: {
          board: {
            eq: filters.board
          }
        }
      });
    }

    return where;
  }
}
