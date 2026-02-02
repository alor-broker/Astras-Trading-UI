import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { MoneyOperationsService } from '../../../../shared/services/money-operations.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { OperationTypes } from '../../../../shared/models/money-operations.models';
import { catchError, take } from 'rxjs/operators';
import { of } from 'rxjs';
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
export class MoneyWithdrawalComponent implements OnInit {
  private readonly service = inject(MoneyOperationsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;
  selectedAgreement: string | null = null;
  isLoading = false;

  ngOnInit(): void {
    this.initForm();
    this.dashboardContextService.selectedPortfolio$.pipe(
      take(1)
    ).subscribe(p => {
      if (p) {
        this.selectedAgreement = (p as any).agreement;
      }
    });
  }

  private initForm() {
    this.form = this.fb.group({
      recipient: [null, [Validators.required]],
      bik: [null, [Validators.required, Validators.pattern(/^\d{9}$/)]],
      accNumber: [null, [Validators.required, Validators.pattern(/^\d{20}$/)]],
      purpose: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(1)]]
    });
  }

  submit() {
    if (!this.form.valid || !this.selectedAgreement) return;

    this.isLoading = true;
    const val = this.form.value;

    const data = JSON.stringify({
      amount: Number(val.amount),
      currency: 'RUB',
      recipient: val.recipient,
      bik: val.bik,
      accNumber: val.accNumber,
      purpose: val.purpose
    });

    this.service.create({
      operationType: OperationTypes.Withdraw,
      agreementNumber: this.selectedAgreement,
      data: data
    }).pipe(
      catchError(() => {
        this.isLoading = false;
        return of(null);
      })
    ).subscribe(res => {
      this.isLoading = false;
      if (res && res.success) {
        // Show success message or navigate
      }
    });
  }
}
