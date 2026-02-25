import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { MoneyOperationsService } from '../../../services/money-operations.service';
import { DashboardContextService } from '../../../../../shared/services/dashboard-context.service';
import { UserPortfoliosService } from '../../../../../shared/services/user-portfolios.service';
import { BankRequisiteItem } from '../../../models/money-operations.models';
import { debounceTime, distinctUntilChanged, filter, finalize, map, switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { isPortfoliosEqual } from '../../../../../shared/utils/portfolios';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'ats-money-withdrawal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    TranslocoDirective
  ],
  templateUrl: './money-withdrawal.component.html',
  styleUrls: ['./money-withdrawal.component.less']
})
export class MoneyWithdrawalComponent {
  private readonly service = inject(MoneyOperationsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly userPortfoliosService = inject(UserPortfoliosService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    recipient: this.fb.control('', [Validators.required]),
    bic: this.fb.control('', [Validators.required, Validators.pattern(/^\d{9}$/)]),
    bankName: this.fb.control('', [Validators.required]),
    loroAccount: this.fb.control('', [Validators.required, Validators.pattern(/^\d{20}$/)]),
    settlementAccount: this.fb.control('', [Validators.required, Validators.pattern(/^\d{20}$/)]),
    amount: this.fb.control(0, [Validators.required, Validators.min(1)])
  });

  readonly isLoading = signal(false);
  readonly savedRequisites = signal<BankRequisiteItem[]>([]);

  readonly selectedPortfolio = toSignal(
    combineLatest([
      this.dashboardContextService.selectedPortfolio$,
      this.userPortfoliosService.getPortfolios()
    ]).pipe(
      map(([selectedKey, allPortfolios]) => {
        if (selectedKey == null || allPortfolios == null) {
          return null;
        }
        return allPortfolios.find(p => isPortfoliosEqual(p, selectedKey)) ?? null;
      })
    ),
    { initialValue: null }
  );

  constructor() {
    toObservable(this.selectedPortfolio).pipe(
      map(portfolio => portfolio?.agreement ?? null),
      filter((agreement): agreement is string => agreement != null && agreement.length > 0),
      distinctUntilChanged(),
      switchMap(agreement => this.service.getAgreementBankRequisites(agreement)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      this.savedRequisites.set(response?.list ?? []);
    });

    this.form.controls.bic.valueChanges.pipe(
      map(v => v.trim()),
      debounceTime(300),
      distinctUntilChanged(),
      filter(v => /^\d{9}$/.test(v)),
      switchMap(bic => this.service.getBankInfoByBic(bic)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(bankInfo => {
      if (bankInfo == null) {
        return;
      }

      this.form.patchValue({
        bankName: bankInfo.bank,
        loroAccount: bankInfo.ks
      });
    });
  }

  applyRequisites(requisites: BankRequisiteItem): void {
    const current = this.form.getRawValue();
    const currentRecipient = current.recipient.trim();
    const currentBic = current.bic.trim();
    const currentBankName = current.bankName.trim();
    const currentLoroAccount = current.loroAccount.trim();
    const currentSettlementAccount = current.settlementAccount.trim();

    this.form.patchValue({
      recipient: currentRecipient.length > 0 ? current.recipient : requisites.recipient,
      bic: currentBic.length > 0 ? current.bic : requisites.bic,
      bankName: currentBankName.length > 0 ? current.bankName : requisites.bankName,
      loroAccount: currentLoroAccount.length > 0 ? current.loroAccount : requisites.loroAccount,
      settlementAccount: currentSettlementAccount.length > 0 ? current.settlementAccount : requisites.settlementAccount
    });
  }

  submit(): void {
    const portfolio = this.selectedPortfolio();
    const agreement = portfolio?.agreement ?? null;
    if (!this.form.valid || agreement == null || portfolio == null) {
      return;
    }

    this.isLoading.set(true);
    const val = this.form.getRawValue();

    this.service.submitWithdrawalWithNotification({
      agreementNumber: agreement,
      portfolio: portfolio.portfolio,
      exchange: portfolio.exchange,
      recipient: val.recipient,
      bic: val.bic,
      bankName: val.bankName,
      loroAccount: val.loroAccount,
      settlementAccount: val.settlementAccount,
      amount: val.amount,
      currency: 'RUB'
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(result => {
      if (result.success) {
        this.form.reset();
      }
    });
  }
}
