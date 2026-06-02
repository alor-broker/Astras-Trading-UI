import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from "@jsverse/transloco";
import {
  BehaviorSubject,
  Observable,
  shareReplay,
  switchMap,
  take,
  tap
} from "rxjs";
import {
  InstrumentInfoType,
  MarketTrendsInstrumentsConnectionType,
  MarketTrendsResponse,
  MarketTrendsResponseScheme
} from "../../gql-schemas/market-trends.gpl-schemas";
import {map} from "rxjs/operators";
import {
  DecimalPipe,
  PercentPipe
} from "@angular/common";
import {LetDirective} from "@ngrx/component";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzSkeletonComponent} from "ng-zorro-antd/skeleton";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {
  NzTabComponent,
  NzTabsComponent,
} from "ng-zorro-antd/tabs";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
  ExtendedFilter,
  MarketSector
} from '@terminal-widgets-lib/widgets/market-trends/types/market-trends.types';
import {
  BasicInformationFilterInput,
  InstrumentModelFilterInput,
  Market,
  QueryInstrumentsArgs,
  SortEnumType,
  TradingDetailsFilterInput
} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {
  FetchPolicy,
  GraphQlService
} from '@terminal-core-lib/features/graphql/services/graph-ql.service';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {withRefresh} from '@terminal-core-lib/common/utils/observable/with-refresh';
import {InputMaybe} from '@terminal-core-lib/features/news/graphql/schema/graphql.types';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';

export interface DisplayParams {
  growOrder: SortEnumType;
  sector: MarketSector | null;
  extendedFilter: ExtendedFilter | null;
}

export interface MarketFilters {
  targetMarkets?: Market[];
  ignoredBoards?: string[];
  instrumentTypes?: string[];
  minTradeAmount?: number;
  minCapitalization?: number;
  maxItemPrice?: number;
}

@Component({
  selector: 'ats-market-trends',
  imports: [
    TranslocoDirective,
    LetDirective,
    NzButtonComponent,
    PercentPipe,
    NzEmptyComponent,
    NzSkeletonComponent,
    NzIconDirective,
    DecimalPipe,
    NzTabComponent,
    NzTypographyComponent,
    NzTabsComponent,
    InstrumentIcon
  ],
  templateUrl: './market-trends.html',
  styleUrl: './market-trends.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MarketTrends implements OnInit {
  readonly itemsCount = input(10);

  readonly showMoreButton = input(true);

  readonly sectors = input<MarketSector[]>([]);

  readonly extendedFilter = input<ExtendedFilter[]>([]);

  readonly fixedHeader = input(false);

  readonly marketFilters = input<MarketFilters | null>(null);

  displayItems$!: Observable<MarketTrendsInstrumentsConnectionType | null>;

  isLoading = false;

  readonly itemsDisplayParams$ = new BehaviorSubject<DisplayParams>({
    growOrder: SortEnumType.Desc,
    sector: null,
    extendedFilter: null
  });

  readonly SortEnumTypes = SortEnumType;

  readonly instrumentSelected = output<InstrumentKey>();

  readonly showMore = output<DisplayParams>();

  private readonly graphQlService = inject(GraphQlService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly REFRESH_TIMEOUT_MS = 30_000;

  ngOnInit(): void {
    this.displayItems$ = this.itemsDisplayParams$.pipe(
      withRefresh(this.REFRESH_TIMEOUT_MS, this.applicationStatusService.isActive$),
      switchMap(params => this.loadMarketTrends(params)),
      takeUntilDestroyed(this.destroyRef),
      shareReplay()
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

  changeSector(targetSector: MarketSector): void {
    this.itemsDisplayParams$.pipe(
      take(1),
    ).subscribe(p => {
      this.itemsDisplayParams$.next({
        ...p,
        sector: targetSector,
        extendedFilter: null
      });
    });
  }

  changeExtendedFilter(extendedFilter: ExtendedFilter): void {
    this.itemsDisplayParams$.pipe(
      take(1),
    ).subscribe(p => {
      this.itemsDisplayParams$.next({
        ...p,
        extendedFilter,
        sector: null
      });
    });
  }

  resetFilters(): void {
    this.itemsDisplayParams$.pipe(
      take(1),
    ).subscribe(p => {
      this.itemsDisplayParams$.next({
        ...p,
        extendedFilter: null,
        sector: null
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

    const marketFilters = this.marketFilters();

    const basicInformationFilter: BasicInformationFilterInput = {
      and: [
        {
          market: {
            in: marketFilters?.targetMarkets ?? [Market.Fond]
          },
        },
        {
          type: {
            neq: null
          }
        },
        {
          type: {
            in: marketFilters?.instrumentTypes ?? ['stock']
          }
        }
      ]
    };

    if (params.sector != null) {
      basicInformationFilter.gicsSector = {
        eq: params.sector
      };
    }

    const tradingDetailsFilter: InputMaybe<TradingDetailsFilterInput> = {
      tradeAmount: {
        gte: marketFilters?.minTradeAmount ?? 1_000_000
      },
      capitalization: {
        gte: marketFilters?.minCapitalization ?? 500_000_000
      }
    };

    if (params.extendedFilter != null && params.extendedFilter === ExtendedFilter.PennyStocks) {
      tradingDetailsFilter.price = {
        lte: marketFilters?.maxItemPrice ?? 1
      };
    }

    const where: InstrumentModelFilterInput = {
      and: [
        {
          basicInformation: basicInformationFilter
        },
        // remove from list not trading instruments
        {
          boardInformation: {
            board: {
              nin: marketFilters?.ignoredBoards ?? ['FQBR']
            }
          }
        },
        {
          tradingDetails: tradingDetailsFilter
        }
      ]
    };

    const args: QueryInstrumentsArgs = {
      first: this.itemsCount(),
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

    return this.graphQlService.queryForSchema<MarketTrendsResponse>(
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
