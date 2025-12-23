import { Component, DestroyRef, input, OnInit, output, inject } from '@angular/core';
import { TranslocoDirective } from "@jsverse/transloco";
import {
  FetchPolicy,
  GraphQlService
} from "../../../../shared/services/graph-ql.service";
import {
  BehaviorSubject,
  defer,
  Observable,
  shareReplay,
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
  BasicInformationFilterInput,
  InputMaybe,
  InstrumentModelFilterInput,
  Market,
  QueryInstrumentsArgs,
  SortEnumType,
  TradingDetailsFilterInput
} from "../../../../../generated/graphql.types";
import { map } from "rxjs/operators";
import {
  DecimalPipe,
  NgClass,
  PercentPipe
} from "@angular/common";
import { LetDirective } from "@ngrx/component";
import { NzButtonComponent } from "ng-zorro-antd/button";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import { NzSkeletonComponent } from "ng-zorro-antd/skeleton";
import { NzIconDirective } from "ng-zorro-antd/icon";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { InstrumentIconComponent } from "../../../../shared/components/instrument-icon/instrument-icon.component";
import {
  NzTabComponent,
  NzTabsComponent,
} from "ng-zorro-antd/tabs";
import {
  ExtendedFilter,
  MarketSector
} from "../../../../shared/models/market-typings.model";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import { REFRESH_TIMEOUT_MS } from "../../../info/constants/info.constants";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { mapWith } from "../../../../shared/utils/observable-helper";

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
    NgClass,
    PercentPipe,
    NzEmptyComponent,
    NzSkeletonComponent,
    NzIconDirective,
    DecimalPipe,
    InstrumentIconComponent,
    NzTabComponent,
    NzTypographyComponent,
    NzTabsComponent
  ],
  templateUrl: './market-trends.component.html',
  styleUrl: './market-trends.component.less'
})
export class MarketTrendsComponent implements OnInit {
  private readonly graphQlService = inject(GraphQlService);
  private readonly destroyRef = inject(DestroyRef);

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

  private readonly REFRESH_TIMEOUT_MS = 30_000;

  ngOnInit(): void {
    const refreshTimer$ = defer(() => {
      return timer(0, REFRESH_TIMEOUT_MS).pipe(
        takeUntilDestroyed(this.destroyRef)
      );
    });

    this.displayItems$ = this.itemsDisplayParams$.pipe(
      mapWith(() => refreshTimer$, (source,) => source),
      switchMap(params => this.loadMarketTrends(params)),
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
