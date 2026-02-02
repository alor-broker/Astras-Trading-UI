import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzCardModule } from 'ng-zorro-antd/card';
import { MoneyOperationsService } from '../../../../shared/services/money-operations.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { UserPortfoliosService } from '../../../../shared/services/user-portfolios.service';
import { OperationSubtypes, OperationTypes, Limits } from '../../../../shared/models/money-operations.models';
import { catchError, filter, switchMap, take, map } from 'rxjs/operators';
import { BehaviorSubject, of, combineLatest } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { isPortfoliosEqual } from '../../../../shared/utils/portfolios';

@Component({
  selector: 'ats-money-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    NzSelectModule,
    NzRadioModule,
    NzCardModule,
    TranslocoDirective
  ],
  templateUrl: './money-input.component.html',
  styleUrls: ['./money-input.component.less']
})
export class MoneyInputComponent implements OnInit {
  private readonly service = inject(MoneyOperationsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly userPortfoliosService = inject(UserPortfoliosService);
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;
  selectedPortfolio: any = null; // Storing full portfolio object
  selectedAgreement: string | null = null;
  isLoading = false;

  // State
  step$ = new BehaviorSubject<'selection' | 'amount' | 'confirm'>('selection');
  operationSubtype: string = OperationSubtypes.Card;

  limits = Limits;

  get subtype() { return this.operationSubtype; }

  ngOnInit(): void {
    this.initForm();

    // Combine selected portfolio key with all portfolios to find the full portfolio object containing the agreement
    combineLatest([
      this.dashboardContextService.selectedPortfolio$,
      this.userPortfoliosService.getPortfolios()
    ]).pipe(
      take(1),
      map(([selectedKey, allPortfolios]) => {
        return allPortfolios.find(p => isPortfoliosEqual(p, selectedKey));
      })
    ).subscribe(p => {
      if (p) {
        this.selectedPortfolio = p;
        this.selectedAgreement = p.agreement;
      }
    });
  }

  private initForm() {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(1)]],
      // Dynamic validators could be added based on subtype
    });
  }

  selectSubtype(subtype: string) {
    this.operationSubtype = subtype;
    this.step$.next('amount');
    this.updateValidators();
  }

  updateValidators() {
    const amountControl = this.form.get('amount');
    if (!amountControl) return;

    if (this.operationSubtype === OperationSubtypes.Card) {
      amountControl.setValidators([Validators.required, Validators.min(this.limits.Card.Min), Validators.max(this.limits.Card.Max)]);
    } else if (this.operationSubtype === OperationSubtypes.Sbp) {
      amountControl.setValidators([Validators.required, Validators.min(this.limits.Sbp.Min), Validators.max(this.limits.Sbp.Max)]);
    }
    amountControl.updateValueAndValidity();
  }

  submitPrepare() {
    if (!this.form.valid || !this.selectedAgreement) return;

    this.isLoading = true;
    const amount = this.form.get('amount')?.value;

    this.service.prepare({
      operationType: OperationTypes.Deposit,
      agreementNumber: this.selectedAgreement,
      data: {
        amount: Number(amount),
        currency: 'RUB', // Hardcoded as per spec
        subtype: this.operationSubtype as any
      }
    }).pipe(
      catchError(() => {
        this.isLoading = false;
        return of(null);
      })
    ).subscribe(response => {
      this.isLoading = false;
      if (response) {
        // Handle validations if any
        if (response.validations?.some(v => !v.isSuccess)) {
          // Show error
          return;
        }
        this.step$.next('confirm');
      }
    });
  }

  submitCreate() {
    if (!this.selectedAgreement || !this.selectedPortfolio) return;
    this.isLoading = true;
    const amount = this.form.get('amount')?.value;

    this.service.create({
      operationType: OperationTypes.Deposit,
      agreementNumber: this.selectedAgreement,
      data: JSON.stringify({
        account: this.selectedPortfolio.portfolio, // Mapping portfolio ID from portfolio object
        exchange: this.selectedPortfolio.exchange, // Mapping exchange from portfolio object
        amount: Number(amount),
        currency: 'RUB',
        paymentMethod: this.operationSubtype
      })
    }).pipe(
      switchMap(res => {
        if (res && res.success) {
          return this.service.getPaymentConfig(res.operationId);
        }
        return of(null);
      }),
      catchError(() => {
        this.isLoading = false;
        return of(null);
      })
    ).subscribe(config => {
      this.isLoading = false;
      if (config) {
        const url = this.service.getMonetaUrl(config);
        // Redirect or open in new window
        window.location.href = url;
      }
    });
  }

  back() {
    const current = this.step$.value;
    if (current === 'confirm') this.step$.next('amount');
    else if (current === 'amount') this.step$.next('selection');
  }
}
