import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {
  map,
  Observable,
  shareReplay
} from 'rxjs';

import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from "@ngrx/component";
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {KeyValuePipe} from '@angular/common';
import {
  NzMenuDirective,
  NzMenuItemComponent
} from 'ng-zorro-antd/menu';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {ExternalLink} from '../../../../external-links/components/external-link/external-link';
import {
  FormBuilder,
  ReactiveFormsModule
} from '@angular/forms';
import {PortfolioExtended} from '../../../../../common/types/portfolio.types';
import {EXTERNAL_LINKS_CONFIG} from '../../../../external-links/external-links.types';
import {PortfoliosStoreFacade} from '../../../../portfolios/store/portfolios-store-facade';
import {mapWith} from '../../../../../common/utils/observable/map-with';
import {PortfolioHelper} from '../../../../../common/utils/portfolio.helper';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {EmptyPortfoliosWarningModal} from '@terminal-core-lib/features/dashboard/common/components/empty-portfolios-warning-modal/empty-portfolios-warning-modal';
import {DASHBOARD_CONTEXT_SERVICE} from '../../../services/dashboard-context-service.types';

@Component({
  selector: 'ats-select-portfolio-menu-nav-btn',
  imports: [
    TranslocoDirective,
    LetDirective,
    NzButtonComponent,
    NzDropdownDirective,
    NzIconDirective,
    NzDropdownMenuComponent,
    NzInputDirective,
    KeyValuePipe,
    NzMenuItemComponent,
    ExternalLink,
    NzTypographyComponent,
    NzPopoverDirective,
    NzMenuDirective,
    ReactiveFormsModule,
    EmptyPortfoliosWarningModal
  ],
  templateUrl: './select-portfolio-menu-nav-btn.html',
  styleUrl: './select-portfolio-menu-nav-btn.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SelectPortfolioMenuNavBtn implements OnInit {
  protected portfolios$!: Observable<Map<string, PortfolioExtended[]>>;

  protected selectedPortfolio$!: Observable<PortfolioExtended | null>;

  protected readonly showEmptyPortfoliosWarning = signal(false);

  protected readonly searchControl = inject(FormBuilder).nonNullable.control('');

  protected readonly externalLinksConfig = inject(EXTERNAL_LINKS_CONFIG);

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly portfoliosStoreFacade = inject(PortfoliosStoreFacade);

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.selectedPortfolio$ = this.dashboardContextService.selectedDashboard$.pipe(
      map(d => d.selectedPortfolio),
      map(p => p ?? null),
      mapWith(() => this.portfolios$, (selectedKey, all) => ({selectedKey, all})),
      map(({selectedKey, all}) => {
        if (!selectedKey) {
          return null;
        }

        return Array.from(all.values())
          .reduce((c, p) => [...p, ...c], [])
          .find(p => p.portfolio === selectedKey.portfolio && p.exchange === selectedKey.exchange && p.marketType === selectedKey.marketType) ?? null;
      })
    );

    this.portfolios$ = this.portfoliosStoreFacade.portfolios$.pipe(
      map(portfolios => PortfolioHelper.groupPortfoliosByAgreement(portfolios)),
      shareReplay(1)
    );

    this.portfolios$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(portfolios => {
        const hasActivePortfolios = Array.from(portfolios.values()).some(p => p.length > 0);

        if (!hasActivePortfolios) {
          this.showEmptyPortfoliosWarning.set(true);
        }
      });
  }

  changePortfolio(key: PortfolioExtended): void {
    this.dashboardContextService.selectDashboardPortfolio({
      portfolio: key.portfolio,
      exchange: key.exchange,
      marketType: key.marketType
    });
  }

  portfolioGroupsTrackByFn(index: number, item: { key: string, value: PortfolioExtended[] }): string {
    return item.key;
  }

  protected portfoliosTrackByFn(index: number, item: PortfolioExtended): string {
    return item.market + item.portfolio;
  }

  protected isFoundPortfolio(portfolio: PortfolioExtended): boolean {
    const {value} = this.searchControl;
    return value == null || (`${portfolio.market} ${portfolio.portfolio}`).toUpperCase().includes((value).toUpperCase());
  }
}
