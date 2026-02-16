import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { TranslocoDirective } from '@jsverse/transloco';
import { OperationsHistoryService } from '../../../../shared/services/operations-history.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { UserPortfoliosService } from '../../../../shared/services/user-portfolios.service';
import {
  HistoryItem,
  HistoryRequestParams,
  HistorySearchType
} from '../../../../shared/models/operations-history.models';
import { isPortfoliosEqual } from '../../../../shared/utils/portfolios';
import { getISOStringDate } from '../../../../shared/utils/datetime';

type FilterGroup = 'moneymove' | 'operation';

interface FilterOption {
  value: string;
  searchType: HistorySearchType;
  group: FilterGroup;
}

@Component({
  selector: 'ats-operations-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzListModule,
    NzButtonModule,
    NzIconModule,
    NzSkeletonModule,
    NzTagModule,
    NzDatePickerModule,
    NzSelectModule,
    TranslocoDirective
  ],
  templateUrl: './operations-history.component.html',
  styleUrls: ['./operations-history.component.less']
})
export class OperationsHistoryComponent implements OnInit {
  private readonly service = inject(OperationsHistoryService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly userPortfoliosService = inject(UserPortfoliosService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() preview = false;
  @Input() limit = 20;
  @Output() showMore = new EventEmitter<void>();

  readonly history$ = new BehaviorSubject<HistoryItem[]>([]);
  readonly isLoading$ = new BehaviorSubject<boolean>(true);

  readonly filterForm = new FormGroup({
    search: new FormControl<string | null>(null),
    dateFrom: new FormControl<Date | null>(null),
    dateTo: new FormControl<Date | null>(null)
  });

  readonly filterOptions: FilterOption[] = [
    { value: 'input', searchType: 'moneymove', group: 'moneymove' },
    { value: 'withdraw', searchType: 'moneymove', group: 'moneymove' },
    { value: 'transfer', searchType: 'moneymove', group: 'moneymove' },
    { value: 'dividends', searchType: 'moneymove', group: 'moneymove' },
    { value: 'coupons', searchType: 'moneymove', group: 'moneymove' },
    { value: 'taxes', searchType: 'moneymove', group: 'moneymove' },
    { value: 'commissions', searchType: 'moneymove', group: 'moneymove' },
    { value: 'moneymove/others', searchType: 'moneymove', group: 'moneymove' },
    { value: 'money_withdrawal', searchType: 'operation', group: 'operation' },
    { value: 'money_input', searchType: 'operation', group: 'operation' },
    { value: 'services', searchType: 'operation', group: 'operation' },
    { value: 'securities', searchType: 'operation', group: 'operation' },
    { value: 'orders', searchType: 'operation', group: 'operation' },
    { value: 'security', searchType: 'operation', group: 'operation' },
    { value: 'operation/others', searchType: 'operation', group: 'operation' }
  ];

  agreementId: string | null = null;
  offset = 0;
  hasMore = true;

  ngOnInit(): void {
    this.bindAgreement();
    this.bindFilters();
  }

  loadMore(): void {
    if (this.isLoading$.getValue() || !this.hasMore || !this.agreementId) {
      return;
    }

    this.offset += this.limit;
    this.loadHistory(true);
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: null,
      dateFrom: null,
      dateTo: null
    });
  }

  hasActiveFilters(): boolean {
    const { search, dateFrom, dateTo } = this.filterForm.getRawValue();
    return !!search || !!dateFrom || !!dateTo;
  }

  getFilterGroupOptions(group: FilterGroup): FilterOption[] {
    return this.filterOptions.filter(o => o.group === group);
  }

  getOptionLabelKey(value: string): string {
    return `operationsHistory.filterOptions.${value.replace('/', '_')}`;
  }

  getTypeCode(item: HistoryItem): string {
    return item.subType || item.type;
  }

  getItemTitle(item: HistoryItem, translate: (key: string) => string): string {
    if (item.title) {
      return item.title;
    }

    const typeCode = this.getTypeCode(item);
    return this.translateWithFallback(translate, `operationsHistory.type.${typeCode}`, typeCode);
  }

  getStatusLabel(item: HistoryItem, translate: (key: string) => string): string {
    if (item.statusName) {
      return item.statusName;
    }

    return this.translateWithFallback(translate, `operationsHistory.status.${item.status}`, item.status);
  }

  getIcon(item: HistoryItem): string {
    switch (this.getTypeCode(item)) {
      case 'input':
      case 'money_input':
        return 'plus-circle';
      case 'withdraw':
      case 'money_withdrawal':
      case 'taxes':
      case 'commissions':
        return 'minus-circle';
      case 'transfer':
      case 'money_between_accounts':
      case 'money_between_subportfolios':
      case 'money_between_agreements':
        return 'swap';
      case 'dividends':
      case 'coupons':
        return 'wallet';
      case 'orders':
        return 'profile';
      case 'security':
        return 'safety-certificate';
      default:
        return 'history';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'executed':
      case 'resolved':
      case 'sent':
        return 'success';
      case 'canceled':
      case 'refused':
        return 'error';
      case 'process':
      case 'executing':
        return 'processing';
      case 'overdue':
        return 'warning';
      default:
        return 'default';
    }
  }

  isNegativeAmount(item: HistoryItem): boolean {
    const amount = item.data?.amount;
    if (amount != null) {
      return amount < 0;
    }

    return ['money_withdrawal', 'withdraw', 'taxes', 'commissions'].includes(this.getTypeCode(item));
  }

  getAbsoluteAmount(item: HistoryItem): number | null {
    const amount = item.data?.amount;
    return amount == null ? null : Math.abs(amount);
  }

  getCounterparty(item: HistoryItem): string {
    return item.data?.accountTo || item.data?.accountNumber || item.data?.accountFrom || '';
  }

  disabledFromDate = (current: Date): boolean => {
    const dateTo = this.filterForm.controls.dateTo.value;
    return this.isFutureDate(current) || (!!dateTo && current > dateTo);
  };

  disabledToDate = (current: Date): boolean => {
    const dateFrom = this.filterForm.controls.dateFrom.value;
    return this.isFutureDate(current) || (!!dateFrom && current < dateFrom);
  };

  private bindAgreement(): void {
    combineLatest([
      this.dashboardContextService.selectedPortfolio$,
      this.userPortfoliosService.getPortfolios()
    ]).pipe(
      map(([selectedKey, allPortfolios]) => allPortfolios.find(p => isPortfoliosEqual(p, selectedKey))?.agreement ?? null),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(agreementId => {
      this.agreementId = agreementId;
      if (!agreementId) {
        this.isLoading$.next(false);
        this.history$.next([]);
        this.hasMore = false;
        return;
      }

      this.reloadHistory();
    });
  }

  private bindFilters(): void {
    this.filterForm.valueChanges.pipe(
      debounceTime(250),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.reloadHistory();
    });
  }

  private reloadHistory(): void {
    if (!this.agreementId) {
      return;
    }

    this.offset = 0;
    this.hasMore = true;
    this.loadHistory(false);
  }

  private loadHistory(concat = false): void {
    if (!this.agreementId) {
      return;
    }

    this.isLoading$.next(true);

    this.service.getHistory(
      this.agreementId,
      this.createRequestParams(this.offset)
    ).pipe(
      catchError(() => of([]))
    ).subscribe(items => {
      this.isLoading$.next(false);
      const loadedItems = items ?? [];

      if (loadedItems.length < this.limit) {
        this.hasMore = false;
      }

      const currentItems = concat ? this.history$.getValue() : [];
      this.history$.next([...currentItems, ...loadedItems]);
    });
  }

  private createRequestParams(offset: number): HistoryRequestParams {
    const { search, dateFrom, dateTo } = this.filterForm.getRawValue();
    const resolvedFilter = this.resolveSearchFilter(search);

    return {
      endpoint: 'all',
      offset,
      limit: this.limit,
      search: resolvedFilter.search,
      searchType: resolvedFilter.searchType,
      loadDocuments: true,
      dateFrom: dateFrom ? getISOStringDate(dateFrom) : undefined,
      dateTo: dateTo ? getISOStringDate(dateTo) : undefined
    };
  }

  private resolveSearchFilter(value: string | null): { search?: string; searchType?: HistorySearchType } {
    if (!value) {
      return {};
    }

    if (value.includes('/')) {
      const [searchType, search] = value.split('/');
      return {
        search,
        searchType: searchType as HistorySearchType
      };
    }

    const option = this.filterOptions.find(o => o.value === value);
    return {
      search: value,
      searchType: option?.searchType
    };
  }

  private translateWithFallback(translate: (key: string) => string, key: string, fallback: string): string {
    const translatedValue = translate(key);
    return translatedValue === key ? fallback : translatedValue;
  }

  private isFutureDate(date: Date): boolean {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return date > now;
  }
}
