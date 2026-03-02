import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal
} from '@angular/core';
import {
  DatePipe,
  DecimalPipe,
  NgClass
} from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  combineLatest,
  of
} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map
} from 'rxjs/operators';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzDatePickerModule} from 'ng-zorro-antd/date-picker';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzListModule} from 'ng-zorro-antd/list';
import {NzSelectModule} from 'ng-zorro-antd/select';
import {NzSkeletonModule} from 'ng-zorro-antd/skeleton';
import {NzTagModule} from 'ng-zorro-antd/tag';
import {TranslocoDirective} from '@jsverse/transloco';
import {OperationsHistoryService} from '../../services/operations-history.service';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {UserPortfoliosService} from '../../../../shared/services/user-portfolios.service';
import {
  HistoryFilterParams,
  HistoryItem,
  HistorySearchType
} from '../../models/operations-history.models';
import {isPortfoliosEqual} from '../../../../shared/utils/portfolios';
import {getISOStringDate} from '../../../../shared/utils/datetime';

type FilterGroup = 'moneymove' | 'operation';

interface FilterOption {
  value: string;
  searchType: HistorySearchType;
  group: FilterGroup;
}

// Enums for type-safe constants
enum HistoryIcon {
  PlusCircle = 'plus-circle',
  MinusCircle = 'minus-circle',
  Swap = 'swap',
  Wallet = 'wallet',
  Profile = 'profile',
  SafetyCertificate = 'safety-certificate',
  History = 'history'
}

enum HistoryStatusColor {
  Success = 'success',
  Error = 'error',
  Processing = 'processing',
  Warning = 'warning',
  Default = 'default'
}

enum HistoryTypeCode {
  Input = 'input',
  MoneyInput = 'money_input',
  Withdraw = 'withdraw',
  MoneyWithdrawal = 'money_withdrawal',
  Taxes = 'taxes',
  Commissions = 'commissions',
  Transfer = 'transfer',
  MoneyBetweenAccounts = 'money_between_accounts',
  MoneyBetweenSubportfolios = 'money_between_subportfolios',
  MoneyBetweenAgreements = 'money_between_agreements',
  Dividends = 'dividends',
  Coupons = 'coupons',
  Orders = 'orders',
  Security = 'security'
}

enum HistoryStatus {
  Executed = 'executed',
  Resolved = 'resolved',
  Sent = 'sent',
  Canceled = 'canceled',
  Refused = 'refused',
  Process = 'process',
  Executing = 'executing',
  Overdue = 'overdue'
}

const STATUS_COLORS: Record<HistoryStatus, HistoryStatusColor> = {
  [HistoryStatus.Executed]: HistoryStatusColor.Success,
  [HistoryStatus.Resolved]: HistoryStatusColor.Success,
  [HistoryStatus.Sent]: HistoryStatusColor.Success,
  [HistoryStatus.Canceled]: HistoryStatusColor.Error,
  [HistoryStatus.Refused]: HistoryStatusColor.Error,
  [HistoryStatus.Process]: HistoryStatusColor.Processing,
  [HistoryStatus.Executing]: HistoryStatusColor.Processing,
  [HistoryStatus.Overdue]: HistoryStatusColor.Warning
};

const NEGATIVE_AMOUNT_TYPES = new Set<string>([
  HistoryTypeCode.MoneyWithdrawal,
  HistoryTypeCode.Withdraw,
  HistoryTypeCode.Taxes,
  HistoryTypeCode.Commissions
]);

@Component({
  selector: 'ats-operations-history',
  imports: [
    ReactiveFormsModule,
    NzListModule,
    NzButtonModule,
    NzIconModule,
    NzSkeletonModule,
    NzTagModule,
    NzDatePickerModule,
    NzSelectModule,
    TranslocoDirective,
    DecimalPipe,
    DatePipe,
    NgClass
  ],
  templateUrl: './operations-history.component.html',
  styleUrls: ['./operations-history.component.less']
})
export class OperationsHistoryComponent implements OnInit {
  readonly limit = input<number>(20);

  readonly showMore = output<void>();

  readonly history = signal<HistoryItem[]>([]);

  readonly isLoading = signal<boolean>(true);

  readonly filterForm = new FormGroup({
    search: new FormControl<string | null>(null),
    dateFrom: new FormControl<Date | null>(null),
    dateTo: new FormControl<Date | null>(null)
  });

  readonly filterOptions: FilterOption[] = [
    {value: HistoryTypeCode.Input, searchType: 'moneymove', group: 'moneymove'},
    {value: HistoryTypeCode.Withdraw, searchType: 'moneymove', group: 'moneymove'},
    {value: HistoryTypeCode.Transfer, searchType: 'moneymove', group: 'moneymove'},
    {value: HistoryTypeCode.Dividends, searchType: 'moneymove', group: 'moneymove'},
    {value: HistoryTypeCode.Coupons, searchType: 'moneymove', group: 'moneymove'},
    {value: HistoryTypeCode.Taxes, searchType: 'moneymove', group: 'moneymove'},
    {value: HistoryTypeCode.Commissions, searchType: 'moneymove', group: 'moneymove'},
    {value: 'moneymove/others', searchType: 'moneymove', group: 'moneymove'},
    {value: HistoryTypeCode.MoneyWithdrawal, searchType: 'operation', group: 'operation'},
    {value: HistoryTypeCode.MoneyInput, searchType: 'operation', group: 'operation'},
    {value: 'services', searchType: 'operation', group: 'operation'},
    {value: 'securities', searchType: 'operation', group: 'operation'},
    {value: HistoryTypeCode.Orders, searchType: 'operation', group: 'operation'},
    {value: HistoryTypeCode.Security, searchType: 'operation', group: 'operation'},
    {value: 'operation/others', searchType: 'operation', group: 'operation'}
  ];

  agreementId: string | null = null;

  offset = 0;

  hasMore = true;

  private readonly service = inject(OperationsHistoryService);

  private readonly dashboardContextService = inject(DashboardContextService);

  private readonly userPortfoliosService = inject(UserPortfoliosService);

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.bindAgreement();
    this.bindFilters();
  }

  loadMore(): void {
    if (this.isLoading() || !this.hasMore || this.agreementId == null) {
      return;
    }

    this.offset += this.limit();
    this.loadHistory(true);
  }

  getFilterGroupOptions(group: FilterGroup): FilterOption[] {
    return this.filterOptions.filter(o => o.group === group);
  }

  getOptionLabelKey(value: string): string {
    return `operationsHistory.filterOptions.${value.replace('/', '_')}`;
  }

  getTypeCode(item: HistoryItem): string {
    return item.subType ?? item.type;
  }

  getItemTitle(item: HistoryItem, translate: (key: string) => string): string {
    if (item.title != null) {
      return item.title;
    }

    const typeCode = this.getTypeCode(item);
    return this.translateWithFallback(translate, `operationsHistory.type.${typeCode}`, typeCode);
  }

  getStatusLabel(item: HistoryItem, translate: (key: string) => string): string {
    if (item.statusName != null) {
      return item.statusName;
    }

    return this.translateWithFallback(translate, `operationsHistory.status.${item.status}`, item.status);
  }

  getIcon(item: HistoryItem): string {
    const typeCode = this.getTypeCode(item);
    return HistoryIcon[typeCode as keyof typeof HistoryIcon] ?? HistoryIcon.History;
  }

  getStatusColor(status: string): string {
    return STATUS_COLORS[status as HistoryStatus] ?? HistoryStatusColor.Default;
  }

  isNegativeAmount(item: HistoryItem): boolean {
    const amount = this.getNumericAmount(item);
    if (amount != null) {
      return amount < 0;
    }

    return NEGATIVE_AMOUNT_TYPES.has(this.getTypeCode(item));
  }

  getAbsoluteAmount(item: HistoryItem): number | null {
    const amount = this.getNumericAmount(item);
    return amount == null ? null : Math.abs(amount);
  }

  getCurrency(item: HistoryItem & { currency?: string }): string | null {
    // Check top-level currency field first (from moneymove API response)
    const currency = item.currency;
    if (currency != null) {
      return currency;
    }

    // Check data.currency (from operation API response)
    return item.data?.currency ?? null;
  }

  getCounterparty(item: HistoryItem): string {
    return item.data?.accountTo ?? item.data?.accountNumber ?? item.data?.accountFrom ?? '';
  }

  disabledFromDate = (current: Date): boolean => {
    const dateTo = this.filterForm.controls.dateTo.value;
    return this.isFutureDate(current) || (dateTo != null && current > dateTo);
  };

  disabledToDate = (current: Date): boolean => {
    const dateFrom = this.filterForm.controls.dateFrom.value;
    return this.isFutureDate(current) || (dateFrom != null && current < dateFrom);
  };

  private getNumericAmount(item: HistoryItem & { sum?: number }): number | null {
    // Check top-level sum field first (from moneymove API response)
    const sum = item.sum;
    if (typeof sum === 'number') {
      return sum;
    }

    // Check data.amount (from operation API response)
    // It can be a number or a string like "в размере свободного остатка"
    const dataAmount = item.data?.amount;
    if (typeof dataAmount === 'number') {
      return dataAmount;
    }

    return null;
  }

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
      if (agreementId == null) {
        this.isLoading.set(false);
        this.history.set([]);
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
    if (this.agreementId == null) {
      return;
    }

    this.offset = 0;
    this.hasMore = true;
    this.loadHistory(false);
  }

  private loadHistory(concat = false): void {
    if (this.agreementId == null) {
      return;
    }

    this.isLoading.set(true);

    this.service.getHistory(
      this.agreementId,
      this.createRequestParams(this.offset)
    ).pipe(
      catchError(() => of([]))
    ).subscribe(items => {
      this.isLoading.set(false);
      const loadedItems = items ?? [];

      if (loadedItems.length < this.limit()) {
        this.hasMore = false;
      }

      const currentItems = concat ? this.history() : [];
      this.history.set([...currentItems, ...loadedItems]);
    });
  }

  private createRequestParams(offset: number): HistoryFilterParams {
    const {search, dateFrom, dateTo} = this.filterForm.getRawValue();
    const resolvedFilter = this.resolveSearchFilter(search);

    return {
      offset,
      limit: this.limit(),
      search: resolvedFilter.search,
      searchType: resolvedFilter.searchType,
      dateFrom: dateFrom != null ? getISOStringDate(dateFrom) : undefined,
      dateTo: dateTo != null ? getISOStringDate(dateTo) : undefined
    };
  }

  private resolveSearchFilter(value: string | null): { search?: string, searchType?: HistorySearchType } {
    if (value == null) {
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
