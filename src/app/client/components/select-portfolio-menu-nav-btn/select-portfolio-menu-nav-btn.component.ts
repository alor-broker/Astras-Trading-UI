import {ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit} from '@angular/core';
import {Observable, shareReplay} from "rxjs";
import {PortfolioExtended} from "../../../shared/models/user/portfolio-extended.model";
import {PortfoliosFeature} from "../../../store/portfolios/portfolios.reducer";
import {filter, map} from "rxjs/operators";
import {EntityStatus} from "../../../shared/models/enums/entity-status";
import {groupPortfoliosByAgreement} from "../../../shared/utils/portfolios";
import {Store} from "@ngrx/store";
import {KeyValuePipe} from "@angular/common";
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {JoyrideModule} from "ngx-joyride";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzDropDownDirective, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzInputDirective} from "ng-zorro-antd/input";
import {NzMenuDirective, NzMenuItemComponent} from "ng-zorro-antd/menu";
import {NzPopoverDirective} from "ng-zorro-antd/popover";
import {TranslocoDirective} from "@jsverse/transloco";
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {mapWith} from "../../../shared/utils/observable-helper";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {LetDirective} from "@ngrx/component";
import {EnvironmentService} from "../../../shared/services/environment.service";
import {
  EmptyPortfoliosWarningModalComponent
} from "../empty-portfolios-warning-modal/empty-portfolios-warning-modal.component";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {ExternalLinkComponent} from "../../../shared/components/external-link/external-link.component";

@Component({
  selector: 'ats-select-portfolio-menu-nav-btn',
  imports: [
    FormsModule,
    JoyrideModule,
    KeyValuePipe,
    NzButtonComponent,
    NzDropDownDirective,
    NzDropdownMenuComponent,
    NzIconDirective,
    NzInputDirective,
    NzMenuDirective,
    NzMenuItemComponent,
    NzPopoverDirective,
    TranslocoDirective,
    LetDirective,
    EmptyPortfoliosWarningModalComponent,
    ReactiveFormsModule,
    NzTypographyComponent,
    ExternalLinkComponent
  ],
  templateUrl: './select-portfolio-menu-nav-btn.component.html',
  styleUrl: './select-portfolio-menu-nav-btn.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectPortfolioMenuNavBtnComponent implements OnInit {
  portfolios$!: Observable<Map<string, PortfolioExtended[]>>;
  selectedPortfolio$!: Observable<PortfolioExtended | null>;
  showEmptyPortfoliosWarning = false;
  readonly searchControl = new FormControl('');
  private readonly environmentService = inject(EnvironmentService);
  readonly externalLinks = this.environmentService.externalLinks;
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly store = inject(Store);
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

        return [...all.values()]
          .reduce((c, p) => [...p, ...c], [])
          .find(p => p.portfolio === selectedKey.portfolio && p.exchange === selectedKey.exchange && p.marketType === selectedKey.marketType) ?? null;
      })
    );

    this.portfolios$ = this.store.select(PortfoliosFeature.selectPortfoliosState).pipe(
      filter(p => p.status === EntityStatus.Success),
      map(portfolios => groupPortfoliosByAgreement(Object.values(portfolios.entities).filter((x): x is PortfolioExtended => !!x))),
      shareReplay(1)
    );

    this.portfolios$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(portfolios => {
        const hasActivePortfolios = Array.from(portfolios.values()).some(p => p.length > 0);

        if (!hasActivePortfolios) {
          this.showEmptyPortfoliosWarning = true;
        }
      });
  }

  portfoliosTrackByFn(index: number, item: PortfolioExtended): string {
    return item.market + item.portfolio;
  }

  isFoundPortfolio(portfolio: PortfolioExtended): boolean {
    const {value} = this.searchControl;
    return value == null || (`${portfolio.market} ${portfolio.portfolio}`).toUpperCase().includes((value).toUpperCase());
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
}
