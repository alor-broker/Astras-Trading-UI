import { ManageDashboardsService } from 'src/app/shared/services/manage-dashboards.service';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { TranslocoDirective } from '@jsverse/transloco';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { LetDirective } from '@ngrx/component';
import { NzTypographyComponent } from 'ng-zorro-antd/typography';
import { SearchClientPortfolioDialogComponent } from '../search-client-portfolio-dialog/search-client-portfolio-dialog.component';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { PortfolioKey } from '../../../shared/models/portfolio-key.model';
import { AdminDashboardsHelper } from "../../utils/admin-dashboards.helper";

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
    private readonly manageDashboardsService: ManageDashboardsService
  ) {
  }

  ngOnDestroy(): void {
    this.selectedPortfolio$.complete();
  }

  ngOnInit(): void {
    this.isSearchDialogVisible = false;
  }

  selectClientPortfolio(portfolio: PortfolioKey): void {
    this.selectedPortfolio$.next(portfolio);
    this.processPortfolioChange(portfolio);
  }

  processPortfolioChange(selectedPortfolio: PortfolioKey): void {
    AdminDashboardsHelper.openDashboardForPortfolio(selectedPortfolio, this.manageDashboardsService);
  }
}
