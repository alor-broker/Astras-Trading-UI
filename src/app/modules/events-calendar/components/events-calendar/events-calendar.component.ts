import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, map } from "rxjs";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { Store } from "@ngrx/store";
import { selectPortfoliosState } from "../../../../store/portfolios/portfolios.selectors";
import { filter } from "rxjs/operators";
import { EntityStatus } from "../../../../shared/models/enums/entity-status";
import { PositionsService } from "../../../../shared/services/positions.service";
import { AuthService } from "../../../../shared/services/auth.service";

@Component({
  selector: 'ats-events-calendar[guid]',
  templateUrl: './events-calendar.component.html',
  styleUrls: ['./events-calendar.component.less']
})
export class EventsCalendarComponent implements OnInit {
  @Input() guid!: string;

  portfolios: PortfolioKey[] = [];
  selectedPortfolio$ = new BehaviorSubject<PortfolioKey | null>(null);
  symbolsOfSelectedPortfolio$?: Observable<string[]>;

  constructor(
    private readonly store: Store,
    private readonly positionsService: PositionsService,
    private readonly authService: AuthService
  ) {
  }

  ngOnInit() {
    this.store.select(selectPortfoliosState)
      .pipe(
        filter(p => p.status === EntityStatus.Success),
      )
      .subscribe(portfolios => {
        this.portfolios = Object.values(portfolios.entities)
          .filter(p => p?.exchange === 'MOEX')
          .map(p => ({ portfolio: p!.portfolio, exchange: p!.exchange, marketType: p!.marketType }));
      });

    this.symbolsOfSelectedPortfolio$ = this.selectedPortfolio$.pipe(
      switchMap(p => {
        if (!p) {
          return this.authService.currentUser$.pipe(
            switchMap(u => this.positionsService.getAllByLogin(u.login!))
          );
        }

        return this.positionsService.getAllByPortfolio(p.portfolio, p.exchange)
          .pipe(
            map(p => p ?? [])
          );
      }),
      map(positions => positions.map(p => p.symbol))
    );
  }

  selectPortfolio(portfolio: PortfolioKey | null) {
    this.selectedPortfolio$.next(portfolio);
  }

  portfolioTrackByFn(index: number, portfolio: PortfolioKey) {
    return portfolio.portfolio + portfolio.exchange;
  }
}
