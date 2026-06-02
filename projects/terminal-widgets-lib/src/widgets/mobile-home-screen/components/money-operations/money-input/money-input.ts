import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzInputModule} from 'ng-zorro-antd/input';
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzSelectModule} from 'ng-zorro-antd/select';
import {NzRadioModule} from 'ng-zorro-antd/radio';
import {NzCardModule} from 'ng-zorro-antd/card';
import {MoneyOperationsService} from '../../../services/money-operations.service';
import {
  catchError,
  finalize,
  map,
  switchMap,
  take
} from 'rxjs/operators';
import {
  combineLatest,
  of
} from 'rxjs';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {toSignal} from '@angular/core/rxjs-interop';
import {
  OperationSubtype,
  OperationSubtypes,
  OperationTypes
} from '@terminal-widgets-lib/widgets/mobile-home-screen/types/money-operations.types';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {PortfoliosStoreFacade} from '@terminal-core-lib/features/portfolios/store/portfolios-store-facade';
import {PortfolioKeyEqualityComparer} from '@terminal-core-lib/common/utils/portfolio-key.helper';
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';

export enum MoneyInputStep {
  Selection = 'selection',
  Amount = 'amount',
  Confirm = 'confirm'
}

@Component({
  selector: 'ats-money-input',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    NzSelectModule,
    NzRadioModule,
    NzCardModule,
    TranslocoDirective,
    NzIconDirective,
    InputNumber,
  ],
  templateUrl: './money-input.html',
  styleUrls: ['./money-input.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MoneyInput {
  readonly steps = MoneyInputStep;

  readonly step = signal<MoneyInputStep>(MoneyInputStep.Selection);

  readonly isLoading = signal(false);

  readonly operationSubtype = signal<OperationSubtype>(OperationSubtypes.Card);

  private readonly moneyService = inject(MoneyOperationsService);

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly userPortfoliosService = inject(PortfoliosStoreFacade);

  readonly selectedPortfolio = toSignal(
    combineLatest([
      this.dashboardContextService.selectedPortfolio$,
      this.userPortfoliosService.portfolios$
    ]).pipe(
      take(1),
      map(([selectedKey, allPortfolios]) => {
        if (selectedKey == null || allPortfolios == null) {
          return null;
        }
        return allPortfolios.find(p => PortfolioKeyEqualityComparer.equals(p, selectedKey)) ?? null;
      })
    ),
    {initialValue: null}
  );

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    amount: this.fb.nonNullable.control(
      1,
      {
        validators: [
          Validators.required,
          Validators.min(0.1),
          Validators.max(InputNumberValidation.max)
        ]
      }
    )
  });

  selectSubtype(subtype: OperationSubtype): void {
    this.operationSubtype.set(subtype);
    this.step.set(MoneyInputStep.Amount);
  }

  submitPrepare(): void {
    const agreement = this.selectedPortfolio()?.agreement ?? null;
    if (!this.form.valid || agreement == null) return;

    this.isLoading.set(true);
    const amount = this.form.controls.amount.value;

    this.moneyService.validateOperation({
      operationType: OperationTypes.Deposit,
      agreementNumber: agreement,
      data: {
        amount: Number(amount),
        currency: 'RUB',
        subtype: this.operationSubtype()
      }
    }).pipe(
      take(1),
      catchError(() => of(null)),
      finalize(() => this.isLoading.set(false))
    ).subscribe(response => {
      if (response != null) {
        const hasErrors = response.validations?.some(v => !v.isSuccess) ?? false;
        if (hasErrors) {
          return;
        }
        this.step.set(MoneyInputStep.Confirm);
      }
    });
  }

  submitCreate(): void {
    const portfolio = this.selectedPortfolio();
    const agreement = portfolio?.agreement ?? null;
    if (agreement == null || portfolio == null) return;

    this.isLoading.set(true);
    const amount = this.form.controls.amount.value;

    this.moneyService.submitOperation({
      operationType: OperationTypes.Deposit,
      agreementNumber: agreement,
      data: {
        account: portfolio.portfolio,
        exchange: portfolio.exchange,
        amount: Number(amount),
        currency: 'RUB',
        paymentMethod: this.operationSubtype()
      }
    }).pipe(
      take(1),
      switchMap(res => {
        if (res != null && res.success) {
          return this.moneyService.getTopUpPaymentDetails(res.operationId);
        }
        return of(null);
      }),
      catchError(() => of(null)),
      finalize(() => this.isLoading.set(false))
    ).subscribe(config => {
      if (config != null) {
        const url = this.moneyService.generatePaymentSystemUrl(config);
        window.location.href = url;
      }
    });
  }

  back(): void {
    const current = this.step();
    if (current === MoneyInputStep.Confirm) {
      this.step.set(MoneyInputStep.Amount);
    } else if (current === MoneyInputStep.Amount) {
      this.step.set(MoneyInputStep.Selection);
    }
  }
}
