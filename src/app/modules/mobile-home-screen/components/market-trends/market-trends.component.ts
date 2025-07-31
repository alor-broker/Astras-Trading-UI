import {
  Component,
  Input,
  OnInit,
  output
} from '@angular/core';
import { TranslocoDirective } from "@jsverse/transloco";
import {
  FetchPolicy,
  GraphQlService
} from "../../../../shared/services/graph-ql.service";
import {
  BehaviorSubject,
  Observable,
  switchMap,
  take,
  tap,
  timer
} from "rxjs";
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
import { map } from "rxjs/operators";
import {
  DecimalPipe,
  NgClass,
  PercentPipe
} from "@angular/common";
import { LetDirective } from "@ngrx/component";
import { NzButtonComponent } from "ng-zorro-antd/button";
import { TruncatedTextComponent } from "../../../../shared/components/truncated-text/truncated-text.component";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import { NzSkeletonComponent } from "ng-zorro-antd/skeleton";
import { NzIconDirective } from "ng-zorro-antd/icon";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { InstrumentIconComponent } from "../../../../shared/components/instrument-icon/instrument-icon.component";

export interface DisplayParams {
  growOrder: SortEnumType;
}

@Component({
    selector: 'ats-market-trends',
  imports: [
    TranslocoDirective,
    LetDirective,
    NzButtonComponent,
    TruncatedTextComponent,
    NgClass,
    PercentPipe,
    NzEmptyComponent,
    NzSkeletonComponent,
    NzIconDirective,
    DecimalPipe,
    InstrumentIconComponent
  ],
    templateUrl: './market-trends.component.html',
    styleUrl: './market-trends.component.less'
})
export class MarketTrendsComponent implements OnInit {
  @Input({required: true})
  marketFilter: Market[] = [Market.Fond];

  @Input({required: true})
  ignoredBoardsFilter: string[] = ['FQBR'];

  displayItems$!: Observable<MarketTrendsInstrumentsConnectionType | null>;
  isLoading = false;

  private readonly itemsDisplayStep = 10;

  readonly itemsDisplayParams$ = new BehaviorSubject<DisplayParams>({
    growOrder: SortEnumType.Desc
  });

  private readonly refreshInterval = 30_000;

  readonly SortEnumTypes = SortEnumType;

  readonly instrumentSelected = output<InstrumentKey>();
  readonly showMore = output<DisplayParams>();

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

  changeSortOrder(): void {
    this.itemsDisplayParams$.pipe(
      take(1),
    ).subscribe(p => {
      this.itemsDisplayParams$.next({
        ...p,
        growOrder: p.growOrder === SortEnumType.Desc ? SortEnumType.Asc : SortEnumType.Desc
      });
    });
  }

  protected toInstrumentKey(item: InstrumentInfoType): InstrumentKey {
    return {
      symbol: item.basicInformation.symbol,
      exchange: item.basicInformation.exchange,
      instrumentGroup: item.boardInformation.board
    };
  }

  protected processShowMore(): void {
    this.itemsDisplayParams$.pipe(
      take(1)
    ).subscribe(p => {
      this.showMore.emit(p);
    });
  }

  private loadMarketTrends(params: DisplayParams): Observable<MarketTrendsInstrumentsConnectionType | null> {
    this.isLoading = true;
    const where: InstrumentModelFilterInput = {
      and: [
        {
          basicInformation: {
            market: {
              in: this.marketFilter ?? [Market.Fond]
            }
          }
        },
        // remove from list not trading instruments
        {
          boardInformation: {
            board: {
              nin: this.ignoredBoardsFilter ?? ['FQBR']
            }
          }
        },
        {
          tradingDetails: {
            tradeVolume: {
               gt: 1
            }
          }
        }
      ]
    };

    const args: QueryInstrumentsArgs = {
      first: this.itemsDisplayStep,
      includeNonBaseBoards: false,
      includeOld: false,
      where,
      order: [
        {
          tradingDetails: {
            dailyGrowthPercent: params.growOrder
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
      take(1),
      tap(() => this.isLoading = false)
    );
  }
}
