import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { MoneyOperationsService } from '../../../services/money-operations.service';
import { DashboardContextService } from '../../../../../shared/services/dashboard-context.service';
import { UserPortfoliosService } from '../../../../../shared/services/user-portfolios.service';
import { BankRequisiteItem, OperationTypes } from '../../../models/money-operations.models';
import { catchError, debounceTime, distinctUntilChanged, filter, finalize, map, switchMap, take } from 'rxjs/operators';
import { combineLatest, of } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { TranslatorService } from '../../../../../shared/services/translator.service';
import { isPortfoliosEqual } from '../../../../../shared/utils/portfolios';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'ats-money-withdrawal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  private readonly translatorService = inject(TranslatorService);
  private readonly notificationService = inject(NzNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    recipient: this.fb.control<string | null>(null, [Validators.required]),
    bic: this.fb.control<string | null>(null, [Validators.required, Validators.pattern(/^\d{9}$/)]),
    bankName: this.fb.control<string | null>(null, [Validators.required]),
    loroAccount: this.fb.control<string | null>(null, [Validators.required, Validators.pattern(/^\d{20}$/)]),
    settlementAccount: this.fb.control<string | null>(null, [Validators.required, Validators.pattern(/^\d{20}$/)]),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)])
  });

  readonly isLoading = signal(false);
  readonly showSavedRequisites = signal(true);
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
      this.showSavedRequisites.set(true);
    });

    this.form.controls.bic.valueChanges.pipe(
      map(v => (v ?? '').toString().trim()),
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
    const currentRecipient = current.recipient?.trim();
    const currentBic = current.bic?.trim();
    const currentBankName = current.bankName?.trim();
    const currentLoroAccount = current.loroAccount?.trim();
    const currentSettlementAccount = current.settlementAccount?.trim();

    this.form.patchValue({
      recipient: currentRecipient != null && currentRecipient.length > 0 ? current.recipient : requisites.recipient,
      bic: currentBic != null && currentBic.length > 0 ? current.bic : requisites.bic,
      bankName: currentBankName != null && currentBankName.length > 0 ? current.bankName : requisites.bankName,
      loroAccount: currentLoroAccount != null && currentLoroAccount.length > 0 ? current.loroAccount : requisites.loroAccount,
      settlementAccount: currentSettlementAccount != null && currentSettlementAccount.length > 0 ? current.settlementAccount : requisites.settlementAccount
    });
  }

  hideSavedRequisites(): void {
    this.showSavedRequisites.set(false);
  }

  submit(): void {
    const portfolio = this.selectedPortfolio();
    const agreement = portfolio?.agreement ?? null;
    if (!this.form.valid || agreement == null || portfolio == null) {
      return;
    }

    this.isLoading.set(true);
    const val = this.form.getRawValue();

    const data = {
      recipient: val.recipient ?? '',
      account: portfolio.portfolio,
      currency: 'RUB',
      subportfolioFrom: portfolio.exchange,
      amount: Number(val.amount ?? 0),
      bic: val.bic ?? '',
      bankName: val.bankName ?? '',
      loroAccount: val.loroAccount ?? '',
      settlementAccount: val.settlementAccount ?? ''
    };

    this.service.submitOperation({
      operationType: OperationTypes.Withdraw,
      agreementNumber: agreement,
      data: data
    }).pipe(
      take(1),
      catchError(() => of(null)),
      finalize(() => this.isLoading.set(false))
    ).subscribe(res => {
      this.translatorService.getTranslator('money-operations').pipe(
        take(1)
      ).subscribe(t => {
        if (res != null && res.success) {
          this.notificationService.success(
            t(['withdrawSubmitSuccessTitle']),
            t(['withdrawSubmitSuccessMessage'])
          );
          this.form.reset();
          return;
        }

        if (res != null) {
          const validationMessage = res.validations
            ?.filter(v => !v.isSuccess)
            .map(v => v.message)
            .join('\n');
          const errorText = validationMessage
            ?? res.errorMessage
            ?? res.message
            ?? t(['withdrawSubmitErrorMessage']);

          this.notificationService.error(
            t(['withdrawSubmitErrorTitle']),
            errorText
          );
        }
      });
    });
  }
}
