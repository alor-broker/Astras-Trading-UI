import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { TranslocoDirective } from '@jsverse/transloco';
import { OperationsHistoryService } from '../../../../shared/services/operations-history.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { UserPortfoliosService } from '../../../../shared/services/user-portfolios.service';
import { HistoryItem } from '../../../../shared/models/operations-history.models';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { isPortfoliosEqual } from '../../../../shared/utils/portfolios';

@Component({
  selector: 'ats-operations-history',
  standalone: true,
  imports: [
    CommonModule,
    NzListModule,
    NzButtonModule,
    NzIconModule,
    NzSkeletonModule,
    TranslocoDirective
  ],
  templateUrl: './operations-history.component.html',
  styleUrls: ['./operations-history.component.less']
})
export class OperationsHistoryComponent implements OnInit {
  private readonly service = inject(OperationsHistoryService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly userPortfoliosService = inject(UserPortfoliosService);

  @Input() preview = false;
  @Input() limit = 20;
  @Output() showMore = new EventEmitter<void>();

  history$ = new BehaviorSubject<HistoryItem[]>([]);
  isLoading$ = new BehaviorSubject<boolean>(true);
  agreementId: string | null = null;
  offset = 0;
  hasMore = true;

  ngOnInit(): void {
    combineLatest([
      this.dashboardContextService.selectedPortfolio$,
      this.userPortfoliosService.getPortfolios()
    ]).pipe(
      take(1),
      map(([selectedKey, allPortfolios]) => {
        return allPortfolios.find(p => isPortfoliosEqual(p, selectedKey));
      })
    ).subscribe(p => {
      if (p && p.agreement) {
        this.agreementId = p.agreement;
        this.loadHistory();
      } else {
        this.isLoading$.next(false);
      }
    });
  }

  loadHistory(concat = false) {
    if (!this.agreementId) return;
    this.isLoading$.next(true);

    this.service.getHistory(this.agreementId, {
      limit: this.limit,
      offset: this.offset
    }).pipe(
      catchError(() => of([]))
    ).subscribe(items => {
      this.isLoading$.next(false);
      const newItems = items || [];

      if (newItems.length < this.limit) {
        this.hasMore = false;
      }

      const current = concat ? this.history$.getValue() : [];
      this.history$.next([...current, ...newItems]);
    });
  }

  loadMore() {
    this.offset += this.limit;
    this.loadHistory(true);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'money_input': return 'plus-circle';
      case 'money_withdrawal': return 'minus-circle';
      case 'trade': return 'swap';
      default: return 'history';
    }
  }

  getColor(type: string): string {
    switch (type) {
      case 'money_input': return '#4caf50'; // Green
      case 'money_withdrawal': return '#f44336'; // Red
      default: return 'inherit';
    }
  }
}
