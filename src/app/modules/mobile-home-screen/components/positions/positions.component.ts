import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of
} from "rxjs";
import { PortfolioExtended } from "../../../../shared/models/user/portfolio-extended.model";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { UserPortfoliosService } from "../../../../shared/services/user-portfolios.service";
import {
  filter,
  map,
  switchMap,
  take
} from "rxjs/operators";
import { isPortfoliosEqual } from "../../../../shared/utils/portfolios";
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { Position } from "../../../../shared/models/positions/position.model";
import { LetDirective } from "@ngrx/component";
import { TruncatedTextComponent } from "../../../../shared/components/truncated-text/truncated-text.component";
import {
  DecimalPipe,
  NgClass,
  PercentPipe
} from "@angular/common";

enum SortBy {
  Ticker = "ticker"
}

interface DisplayParams {
  itemsDisplayCount: number;
  sortBy: SortBy;
  sortDesc: boolean;
}

interface DisplayPositions {
  items: Position[];
  totalItems: number;
}

type SortFn = (a: Position, b: Position) => number;

@Component({
  selector: 'ats-positions',
  standalone: true,
  imports: [
    LetDirective,
    TruncatedTextComponent,
    DecimalPipe,
    PercentPipe,
    NgClass
  ],
  templateUrl: './positions.component.html',
  styleUrl: './positions.component.less'
})
export class PositionsComponent implements OnInit, OnDestroy {
  @Input({required: true})
  guid!: string;

  displayPositions$!: Observable<DisplayPositions>;
  private readonly itemsDisplayStep = 20;
  readonly itemsDisplayParams$ = new BehaviorSubject<DisplayParams>({
    itemsDisplayCount: this.itemsDisplayStep,
    sortBy: SortBy.Ticker,
    sortDesc: false
  });

  constructor(
    private readonly dashboardContextService: DashboardContextService,
    private readonly userPortfoliosService: UserPortfoliosService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService
  ) {
  }

  ngOnDestroy(): void {
    this.itemsDisplayParams$.complete();
  }

  ngOnInit(): void {
    const positions$ = this.getCurrentAgreementPortfolios().pipe(
      switchMap(portfolios => this.getPositions(portfolios))
    );

    this.displayPositions$ = combineLatest({
      allPositions: positions$,
      params: this.itemsDisplayParams$
    }).pipe(
      map(x => {
        return {
          items: this.getDisplayItems(x.allPositions, x.params),
          totalItems: x.allPositions.length
        };
      })
    );
  }

  showMoreItems(): void {
    this.itemsDisplayParams$.pipe(
      take(1),
    ).subscribe(p => {
      this.itemsDisplayParams$.next({
        ...p,
        itemsDisplayCount: p.itemsDisplayCount + this.itemsDisplayStep
      });
    });
  }

  trackBy(index: number, item: Position): string {
    return `${item.targetInstrument.symbol}_${item.targetInstrument.exchange}${item.ownedPortfolio.portfolio}`;
  }

  calculateDailyUnrealisedPlRatio(position: Position): number {
    return position.dailyUnrealisedPl / Math.abs(position.volume);
  }

  private getCurrentAgreementPortfolios(): Observable<PortfolioExtended[]> {
    return combineLatest({
      selectedPortfolio: this.dashboardContextService.selectedPortfolio$,
      allPortfolios: this.userPortfoliosService.getPortfolios()
    }).pipe(
      map(x => {
        const currentPortfolio = x.allPortfolios.find(p => isPortfoliosEqual(p, x.selectedPortfolio));

        if (currentPortfolio == null) {
          return null;
        }

        return {
          agreement: currentPortfolio.agreement,
          portfolios: x.allPortfolios.filter(p => p.agreement === currentPortfolio.agreement)
        };
      }),
      filter(p => !!p),
      distinctUntilChanged((previous, current) => previous.agreement === current.agreement),
      map(x => x.portfolios)
    );
  }

  private getPositions(portfolios: PortfolioKey[]): Observable<Position[]> {
    if (portfolios.length === 0) {
      return of([]);
    }

    return combineLatest(
      portfolios.map(p => this.portfolioSubscriptionsService.getAllPositionsSubscription(p.portfolio, p.exchange))
    ).pipe(
      map(x => x.flat())
    );
  }

  private getDisplayItems(allPositions: Position[], params: DisplayParams): Position[] {
    const sortFn = this.getSortFn(params);
    const sorted = allPositions
      .filter(p => p.currentVolume > 0)
      .sort(sortFn);

    return sorted.slice(0, params.itemsDisplayCount);
  }

  private getSortFn(params: DisplayParams): SortFn {
    // For now ony sort by ticker is supported
    let sortFn = this.sortByTicker;

    if (params.sortDesc) {
      sortFn = (a, b): number => {
        return sortFn(a, b) * -1;
      };
    }

    return sortFn;
  }

  private readonly sortByTicker: SortFn = (a, b): number => {
    const ticketComp = a.targetInstrument.symbol.localeCompare(b.targetInstrument.symbol);

    if (ticketComp === 0) {
      const exchangeComp = a.targetInstrument.exchange.localeCompare(b.targetInstrument.exchange);
      if (exchangeComp === 0) {
        return a.ownedPortfolio.portfolio.localeCompare(b.ownedPortfolio.portfolio);
      }

      return exchangeComp;
    }

    return ticketComp;
  };
}
