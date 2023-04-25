import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from "rxjs";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { Store } from "@ngrx/store";
import { selectPortfoliosState } from "../../../../store/portfolios/portfolios.selectors";
import { filter } from "rxjs/operators";
import { EntityStatus } from "../../../../shared/models/enums/entity-status";

@Component({
  selector: 'ats-events-calendar[guid]',
  templateUrl: './events-calendar.component.html',
  styleUrls: ['./events-calendar.component.less']
})
export class EventsCalendarComponent implements OnInit {
  @Input() guid!: string;

  portfolios: PortfolioKey[] = [];
  selectedPortfolio$ = new BehaviorSubject<PortfolioKey | null>(null);

  constructor(private readonly store: Store) {
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
  }

  selectPortfolio(portfolio: PortfolioKey) {
    this.selectedPortfolio$.next(portfolio);
  }

  portfolioTrackByFn(index: number, portfolio: PortfolioKey) {
    return portfolio.portfolio + portfolio.exchange;
  }
}
