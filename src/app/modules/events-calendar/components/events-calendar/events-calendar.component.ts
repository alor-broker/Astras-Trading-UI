import {Component, DestroyRef, Input, OnDestroy, OnInit} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  switchMap,
  map,
  shareReplay
} from "rxjs";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { Store } from "@ngrx/store";
import { filter } from "rxjs/operators";
import { EntityStatus } from "../../../../shared/models/enums/entity-status";
import { PositionsService } from "../../../../shared/services/positions.service";
import { AuthService } from "../../../../shared/services/auth.service";
import { MarketService } from "../../../../shared/services/market.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { PortfoliosFeature } from "../../../../store/portfolios/portfolios.reducer";

@Component({
  selector: 'ats-events-calendar',
  templateUrl: './events-calendar.component.html',
  styleUrls: ['./events-calendar.component.less']
})
export class EventsCalendarComponent implements OnInit, OnDestroy {
  @Input({required: true})
  guid!: string;

  portfolios: PortfolioKey[] = [];
  selectedPortfolio$ = new BehaviorSubject<PortfolioKey | null>(null);
  symbolsOfSelectedPortfolio$?: Observable<string[]>;

  constructor(
    private readonly store: Store,
    private readonly positionsService: PositionsService,
    private readonly authService: AuthService,
    private readonly marketService: MarketService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.store.select(PortfoliosFeature.selectPortfoliosState)
      .pipe(
        filter(p => p.status === EntityStatus.Success),
        mapWith(
          () => this.marketService.getDefaultExchange(),
          (portfolios, exchange) => ({ portfolios, exchange })
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ portfolios, exchange }) => {
        this.portfolios = Object.values(portfolios.entities)
          .filter(p => p?.exchange === exchange)
          .map(p => ({ portfolio: p!.portfolio, exchange: p!.exchange, marketType: p!.marketType }));
      });

    this.symbolsOfSelectedPortfolio$ = this.selectedPortfolio$.pipe(
      switchMap(p => {
        if (!p) {
          return this.authService.currentUser$.pipe(
            switchMap(u => this.positionsService.getAllByLogin(u.login!)),
            map(positions => positions.map(p => p.symbol))
          );
        }

        return this.positionsService.getAllByPortfolio(p.portfolio, p.exchange)
          .pipe(
            map(p => (p ?? []).map(i => i.targetInstrument.symbol))
          );
      }),
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
