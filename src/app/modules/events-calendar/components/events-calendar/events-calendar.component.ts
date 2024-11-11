import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  switchMap,
  map,
  shareReplay,
  take,
  forkJoin, combineLatest
} from "rxjs";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { Store } from "@ngrx/store";
import { filter } from "rxjs/operators";
import { EntityStatus } from "../../../../shared/models/enums/entity-status";
import { PositionsService } from "../../../../shared/services/positions.service";
import { MarketService } from "../../../../shared/services/market.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { PortfoliosFeature } from "../../../../store/portfolios/portfolios.reducer";
import {Exchange} from "../../../../../generated/graphql.types";

@Component({
  selector: 'ats-events-calendar',
  templateUrl: './events-calendar.component.html',
  styleUrls: ['./events-calendar.component.less']
})
export class EventsCalendarComponent implements OnInit, OnDestroy {
  @Input({required: true})
  guid!: string;

  portfolios$!: Observable<PortfolioKey[]>;
  selectedPortfolio$ = new BehaviorSubject<PortfolioKey | null>(null);
  symbolsOfSelectedPortfolio$?: Observable<string[]>;

  constructor(
    private readonly store: Store,
    private readonly positionsService: PositionsService,
    private readonly marketService: MarketService
  ) {
  }

  ngOnInit(): void {
    this.portfolios$ = this.store.select(PortfoliosFeature.selectPortfoliosState)
      .pipe(
        filter(p => p.status === EntityStatus.Success),
        mapWith(
          () => this.marketService.getDefaultExchange(),
          (portfolios, exchange) => ({ portfolios, exchange })
        ),
        map(({ portfolios, exchange }) => {
          return Object.values(portfolios.entities)
            .filter(p => p?.exchange === exchange || (p?.exchange === Exchange.United as string))
            .map(p => ({ portfolio: p!.portfolio, exchange: p!.exchange, marketType: p!.marketType }));
        }),
        shareReplay(1)
      );

    this.symbolsOfSelectedPortfolio$ = combineLatest({
      allPortfolios: this.portfolios$,
      selectedPortfolio: this.selectedPortfolio$
    }).pipe(
      switchMap(x => {
        if (x.selectedPortfolio == null) {
          const portfolioRequests = x.allPortfolios.map(
            p => this.positionsService.getAllByPortfolio(p.portfolio, p.exchange).pipe(
              map(p => p ?? []),
              take(1)
            )
          );

          return forkJoin(portfolioRequests).pipe(
            map(responses => {
              return responses.reduce((prev, curr) => [...prev, ...curr], []);
            })
          );
        }

        return this.positionsService.getAllByPortfolio(x.selectedPortfolio.portfolio, x.selectedPortfolio.exchange)
          .pipe(
            map(p => p ?? [])
          );
      }),
      map(positions => [...new Set(positions.map(p => p.targetInstrument.symbol)).values()]),
      shareReplay(1)
    );
  }

  ngOnDestroy(): void {
    this.selectedPortfolio$.complete();
  }

  selectPortfolio(portfolio: PortfolioKey | null): void {
    this.selectedPortfolio$.next(portfolio);
  }

  portfolioTrackByFn(index: number, portfolio: PortfolioKey): string {
    return portfolio.portfolio + portfolio.exchange;
  }
}
