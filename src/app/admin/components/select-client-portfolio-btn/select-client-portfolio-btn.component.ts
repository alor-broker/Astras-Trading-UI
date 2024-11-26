import {DefaultAdminDashboardConfig} from '../../../shared/models/dashboard/dashboard.model';
import {ManageDashboardsService} from 'src/app/shared/services/manage-dashboards.service';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {TranslocoDirective} from '@jsverse/transloco';
import {BehaviorSubject, combineLatest, take} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {LetDirective} from '@ngrx/component';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {
  SearchClientPortfolioDialogComponent
} from '../search-client-portfolio-dialog/search-client-portfolio-dialog.component';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {PortfolioKey} from '../../../shared/models/portfolio-key.model';
import {GuidGenerator} from 'src/app/shared/utils/guid';
import {PortfoliosInternalActions} from "../../../store/portfolios/portfolios.actions";
import {Store} from "@ngrx/store";
import {Exchange} from "../../../../generated/graphql.types";

@Component({
  selector: 'ats-select-client-portfolio-btn',
  standalone: true,
  imports: [
    NzButtonComponent,
    TranslocoDirective,
    AsyncPipe,
    LetDirective,
    NzTypographyComponent,
    SearchClientPortfolioDialogComponent,
    NzIconDirective,
  ],
  templateUrl: './select-client-portfolio-btn.component.html',
  styleUrl: './select-client-portfolio-btn.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectClientPortfolioBtnComponent implements OnInit, OnDestroy {
  readonly selectedPortfolio$ = new BehaviorSubject<PortfolioKey | null>(null);

  isSearchDialogVisible = false;

  constructor(
    private readonly manageDashboardsService: ManageDashboardsService,
    private readonly store: Store
  ) {
  }

  ngOnDestroy(): void {
    this.selectedPortfolio$.complete();
  }

  ngOnInit(): void {
    this.isSearchDialogVisible = true;
  }

  selectClientPortfolio(portfolio: PortfolioKey): void {
    this.selectedPortfolio$.next(portfolio);
    this.processPortfolioChange(portfolio);
  }

  processPortfolioChange(selectedPortfolio: PortfolioKey): void {
    combineLatest({
      allDashboards: this.manageDashboardsService.allDashboards$,
      defaultConfigs: this.manageDashboardsService.getDefaultDashboardConfig(),
    })
      .pipe(take(1))
      .subscribe((x) => {
        const dashboardTitle = `${selectedPortfolio.exchange} ${selectedPortfolio.portfolio}`;
        const existingDashboard = x.allDashboards.find(d => d.title === dashboardTitle);

        if (existingDashboard != null) {
          return;
        }

        const standardConfig = x.defaultConfigs
          .filter((d) => d.type === 'admin')
          .map((d) => d as DefaultAdminDashboardConfig)[0];

        if (standardConfig != null) {
          x.allDashboards.forEach((d) => {
            this.manageDashboardsService.removeDashboard(d.guid);
          });

          this.store.dispatch(PortfoliosInternalActions.initWithList({
            portfolios: [
              {
                exchange: selectedPortfolio.exchange,
                portfolio: selectedPortfolio.portfolio,
                agreement: '',
                isVirtual: selectedPortfolio.exchange === (Exchange.United as string),
                market: '',
                tks: ''
              }
            ]
          }));

          this.manageDashboardsService.addDashboardWithTemplate({
            title: dashboardTitle,
            items: standardConfig.widgets.map((w) => ({
              guid: GuidGenerator.newGuid(),
              widgetType: w.widgetTypeId,
              position: w.position,
              initialSettings: w.initialSettings,
            })),
            selectedPortfolio,
            isSelected: true,
          });
        }
      });
  }
}
