import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable
} from "rxjs";
import {
  map,
  switchMap,
  take
} from "rxjs/operators";
import {LetDirective} from "@ngrx/component";
import {
  DecimalPipe,
  PercentPipe
} from "@angular/common";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzSkeletonComponent} from "ng-zorro-antd/skeleton";
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';

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
  selector: 'ats-mobile-home-screen-positions',
  imports: [
    LetDirective,
    DecimalPipe,
    PercentPipe,
    TranslocoDirective,
    NzButtonComponent,
    NzEmptyComponent,
    NzSkeletonComponent,
    InstrumentIcon
  ],
  templateUrl: './mobile-home-screen-positions.html',
  styleUrl: './mobile-home-screen-positions.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MobileHomeScreenPositions implements OnInit, OnDestroy {
  displayPositions$!: Observable<DisplayPositions>;

  readonly instrumentSelected = output<InstrumentKey>();

  protected readonly isFinite = isFinite;

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly itemsDisplayStep = 20;

  readonly itemsDisplayParams$ = new BehaviorSubject<DisplayParams>({
    itemsDisplayCount: this.itemsDisplayStep,
    sortBy: SortBy.Ticker,
    sortDesc: false
  });

  ngOnDestroy(): void {
    this.itemsDisplayParams$.complete();
  }

  ngOnInit(): void {
    const positions$ = this.dashboardContextService.selectedPortfolio$.pipe(
      switchMap(p => this.portfolioSubscriptionsService.getAllPositionsSubscription(p.portfolio, p.exchange))
    );

    this.displayPositions$ = combineLatest({
      allPositions: positions$,
      params: this.itemsDisplayParams$
    }).pipe(
      map(x => {
        const filteredPositions = x.allPositions.filter(p => p.currentVolume != 0);

        return {
          items: this.getDisplayItems(filteredPositions, x.params),
          totalItems: filteredPositions.length
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

  trackBy(item: Position): string {
    return `${item.targetInstrument.symbol}_${item.targetInstrument.exchange}${item.ownedPortfolio.portfolio}`;
  }

  calculateDailyUnrealisedPlRatio(position: Position): number {
    return position.dailyUnrealisedPl / Math.abs(position.volume);
  }

  private getDisplayItems(allPositions: Position[], params: DisplayParams): Position[] {
    const sortFn = this.getSortFn(params);
    const sorted = allPositions
      .sort(sortFn);

    return sorted.slice(0, params.itemsDisplayCount);
  }

  private getSortFn(params: DisplayParams): SortFn {
    // For now ony sort by pl is supported
    let sortFn = this.sortByPl;

    if (params.sortDesc) {
      sortFn = (a, b): number => {
        return sortFn(a, b) * -1;
      };
    }

    return sortFn;
  }

  private readonly sortByPl: SortFn = (a, b): number => {
    return b.dailyUnrealisedPl - a.dailyUnrealisedPl;
  };
}
