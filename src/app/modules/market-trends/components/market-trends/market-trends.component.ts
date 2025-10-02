import {
  Component,
  input,
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
  NzTabSetComponent
} from "ng-zorro-antd/tabs";
import {
  ExtendedFilter,
  MarketSector
} from "../../../../shared/models/market-typings.model";
import { NzTypographyComponent } from "ng-zorro-antd/typography";

export interface DisplayParams {
  growOrder: SortEnumType;
  sector: MarketSector | null;
  extendedFilter: ExtendedFilter | null;
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
    NzTabSetComponent,
    NzTabComponent,
    NzTypographyComponent
  ],
  templateUrl: './market-trends.component.html',
  styleUrl: './market-trends.component.less'
})
export class MarketTrendsComponent implements OnInit {
  marketFilter = input([Market.Fond]);

  ignoredBoardsFilter = input(['FQBR']);

  itemsCount = input(10);

  showMoreButton = input(true);

  sectors = input<MarketSector[]>([]);

  extendedFilter = input<ExtendedFilter[]>([]);

  fixedHeader = input(false);

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

    const basicInformationFilter: BasicInformationFilterInput = {
      and: [
        {
          market: {
            in: this.marketFilter() ?? [Market.Fond]
          },
        },
        {
          type: {
            neq: null
          }
        },
        {
          type: {
            eq: "stock"
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
        gte: 1_000_000
      },
      capitalization: {
        gte: 500_000_000
      }
    };

    if (params.extendedFilter != null && params.extendedFilter === ExtendedFilter.PennyStocks) {
      tradingDetailsFilter.price = {
        lte: 1
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
              nin: this.ignoredBoardsFilter() ?? ['FQBR']
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
