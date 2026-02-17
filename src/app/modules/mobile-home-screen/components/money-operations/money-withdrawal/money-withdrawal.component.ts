import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { MoneyOperationsService } from '../../../../../shared/services/money-operations.service';
import { DashboardContextService } from '../../../../../shared/services/dashboard-context.service';
import { OperationTypes } from '../../../../../shared/models/money-operations.models';
import { catchError, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { PortfolioKey } from "../../../../../shared/models/portfolio-key.model";
import { TranslocoDirective } from '@jsverse/transloco';

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
export class MoneyWithdrawalComponent implements OnInit, OnDestroy {
  private readonly service = inject(MoneyOperationsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;
  selectedAgreement: string | null = null;
  isLoading = false;

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
    this.dashboardContextService.selectedPortfolio$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((p: PortfolioKey | null) => {
      if (p != null) {
        this.selectedAgreement = (p as { agreement?: string }).agreement ?? null;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      recipient: [null, [Validators.required]],
      bik: [null, [Validators.required, Validators.pattern(/^\d{9}$/)]],
      accNumber: [null, [Validators.required, Validators.pattern(/^\d{20}$/)]],
      purpose: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(1)]]
    });
  }

  submit(): void {
    const isFormValid = this.form.valid;
    const hasAgreement = (this.selectedAgreement ?? '').length > 0;

    if (!isFormValid || !hasAgreement) {
      return;
    }

    this.isLoading = true;
    const val = this.form.value as {
      amount: string;
      recipient: string;
      bik: string;
      accNumber: string;
      purpose: string;
    };

    const data = {
      amount: Number(val.amount),
      currency: 'RUB',
      recipient: val.recipient,
      bik: val.bik,
      accNumber: val.accNumber,
      purpose: val.purpose
    };

    this.service.submitOperation({
      operationType: OperationTypes.Withdraw,
      agreementNumber: this.selectedAgreement!,
      data: data
    }).pipe(
      catchError(() => {
        this.isLoading = false;
        return of(null);
      })
    ).subscribe(res => {
      this.isLoading = false;
      if (res != null && res.success) {
        // Show success message or navigate
      }
    });
  }
}
