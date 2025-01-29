import {Component, OnInit} from '@angular/core';
import {TranslocoDirective} from "@jsverse/transloco";
import {FetchPolicy, GraphQlService} from "../../../../shared/services/graph-ql.service";
import {BehaviorSubject, Observable, switchMap, take, timer} from "rxjs";
import {
  InstrumentInfoType,
  MarketTrendsInstrumentsConnectionType,
  MarketTrendsResponse,
  MarketTrendsResponseScheme
} from "../../gql-schemas/market-trends.gpl-schemas";
import {
  InstrumentModelFilterInput,
  Market,
  QueryInstrumentsArgs,
  SortEnumType
} from "../../../../../generated/graphql.types";
import {map} from "rxjs/operators";
import {NgClass, PercentPipe} from "@angular/common";
import {LetDirective} from "@ngrx/component";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {TruncatedTextComponent} from "../../../../shared/components/truncated-text/truncated-text.component";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzSkeletonComponent} from "ng-zorro-antd/skeleton";

interface DisplayParams {
  itemsDisplayCount: number;
}

@Component({
  selector: 'ats-market-trends',
  standalone: true,
  imports: [
    TranslocoDirective,
    LetDirective,
    NzButtonComponent,
    TruncatedTextComponent,
    NgClass,
    PercentPipe,
    NzEmptyComponent,
    NzSkeletonComponent
  ],
  templateUrl: './market-trends.component.html',
  styleUrl: './market-trends.component.less'
})
export class MarketTrendsComponent implements OnInit {
  displayItems$!: Observable<MarketTrendsInstrumentsConnectionType | null>;
  readonly maxDisplayItems = 1000;

  isLoading = false;

  private readonly itemsDisplayStep = 20;

  readonly itemsDisplayParams$ = new BehaviorSubject<DisplayParams>({
    itemsDisplayCount: this.itemsDisplayStep
  });

  private readonly refreshInterval = 30_000;

  constructor(
    private readonly graphQlService: GraphQlService
  ) {
  }

  ngOnInit(): void {
    const requestTrends = (params: DisplayParams): Observable<MarketTrendsInstrumentsConnectionType | null> => {
      return timer(0, this.refreshInterval).pipe(
        switchMap(() => this.loadMarketTrends(params))
      );
    };

    this.displayItems$ = this.itemsDisplayParams$.pipe(
      switchMap(params => requestTrends(params))
    );
  }

  trackBy(item: InstrumentInfoType): string {
    return `${item.basicInformation.symbol}_${item.basicInformation.exchange}`;
  }

  showMoreItems(): void {
    this.isLoading = true;

    this.itemsDisplayParams$.pipe(
      take(1),
    ).subscribe(p => {
      this.itemsDisplayParams$.next({
        ...p,
        itemsDisplayCount: Math.round(Math.min(this.maxDisplayItems, p.itemsDisplayCount + this.itemsDisplayStep))
      });
      this.isLoading = false;
    });
  }

  private loadMarketTrends(params: DisplayParams): Observable<MarketTrendsInstrumentsConnectionType | null> {
    const where: InstrumentModelFilterInput = {
      and: [
        {
          basicInformation: {
            market: {
              eq: Market.Fond
            }
          }
        },
        // remove from list not trading instruments
        {
          boardInformation: {
            board: {
              neq: 'FQBR'
            }
          }
        }
      ]
    };

    const args: QueryInstrumentsArgs = {
      first: params.itemsDisplayCount,
      includeNonBaseBoards: false,
      includeOld: false,
      where,
      order: [
        {
          tradingDetails: {
            dailyGrowthPercent: SortEnumType.Desc
          }
        },
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

    return this.graphQlService.watchQueryForSchema<MarketTrendsResponse>(
      MarketTrendsResponseScheme,
      {
        first: args.first,
        includeNonBaseBoards: args.includeNonBaseBoards,
        includeOld: args.includeOld,
        where: {value: args.where, type: 'InstrumentModelFilterInput'},
        order: {value: args.order, type: '[InstrumentModelSortInput!]'},
      },
      {fetchPolicy: FetchPolicy.NoCache}
    ).pipe(
      map(r => {
        if (r == null) {
          return null;
        }

        return {
          nodes: r.instruments.nodes,
          totalCount: r.instruments.totalCount,
        };
      }),
      take(1)
    );
  }
}
