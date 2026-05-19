import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  forkJoin,
  map,
  Observable,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzTabComponent,
  NzTabsComponent
} from 'ng-zorro-antd/tabs';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {
  NzMenuDirective,
  NzMenuItemComponent
} from 'ng-zorro-antd/menu';
import {AsyncPipe} from '@angular/common';
import {AllPositionsService} from '@terminal-core-lib/features/client-info/services/all-positions.service';
import {MarketService} from '@terminal-core-lib/features/market-config/market.service';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {PortfoliosStoreFacade} from '@terminal-core-lib/features/portfolios/store/portfolios-store-facade';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {Exchange} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';
import {CalendarViewComponent} from '@terminal-widgets-lib/widgets/events-calendar/components/events-calendar-view/events-calendar-view';
import {EventsListView} from '@terminal-widgets-lib/widgets/events-calendar/components/events-list-view/events-list-view';

@Component({
  selector: 'ats-events-calendar',
  templateUrl: './events-calendar.html',
  styleUrls: ['./events-calendar.less'],
  imports: [
    TranslocoDirective,
    NzTabsComponent,
    NzTabComponent,
    NzButtonComponent,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    AsyncPipe,
    NzDropdownDirective,
    CalendarViewComponent,
    EventsListView
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EventsCalendar implements OnInit, OnDestroy {
  readonly guid = input.required<string>();

  portfolios$!: Observable<PortfolioKey[]>;

  selectedPortfolio$ = new BehaviorSubject<PortfolioKey | null>(null);

  symbolsOfSelectedPortfolio$?: Observable<string[]>;

  private readonly portfoliosStoreFacade = inject(PortfoliosStoreFacade);

  private readonly positionsService = inject(AllPositionsService);

  private readonly marketService = inject(MarketService);

  ngOnInit(): void {
    this.portfolios$ = this.portfoliosStoreFacade.portfolios$
      .pipe(
        mapWith(
          () => this.marketService.getDefaultExchange(),
          (portfolios, exchange) => ({portfolios, exchange})
        ),
        map(({portfolios, exchange}) => {
          return portfolios
            .filter(p => p?.exchange === exchange || (p?.exchange === Exchange.United as string))
            .map(p => ({portfolio: p!.portfolio, exchange: p!.exchange, marketType: p!.marketType}));
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
