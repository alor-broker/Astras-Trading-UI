import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {CommonParametersService} from "../../../services/common-parameters.service";
import {
  debounceTime,
  filter,
  map,
  startWith,
  switchMap
} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  shareReplay,
  take
} from "rxjs";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent
} from 'ng-zorro-antd/form';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from 'ng-zorro-antd/collapse';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzCheckboxComponent} from 'ng-zorro-antd/checkbox';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {
  AsyncPipe,
  DecimalPipe,
  KeyValuePipe
} from '@angular/common';
import {BaseEditOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/base-edit-order-form';
import {OrderDetailsService} from '@terminal-core-lib/features/orders/services/order-details.service';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {ConfirmableOrderCommandsService} from '@terminal-core-lib/features/orders/services/confirmable-order-commands.service';
import {TimeInForce} from '@terminal-core-lib/features/orders/types/orders.types';
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {SingleOrderEvaluation} from '@terminal-core-lib/features/orders/services/evaluation-service.types';
import {Order} from '@terminal-core-lib/features/portfolios/types/order.types';
import {priceStepMultiplicity} from '@terminal-core-lib/features/forms/validators/price-step-multiplicity';
import {notBiggerThan} from '@terminal-core-lib/features/forms/validators/not-bigger-than';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {PriceDiffHelper} from '@terminal-widgets-lib/widgets/order-commands/utils/price-diff.helper';
import {LimitOrderEdit} from '@terminal-core-lib/features/orders/types/edit-order.types';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';
import {ShortNumber} from '@terminal-core-lib/common/components/short-number/short-number';
import {OrderEvaluation} from '@terminal-widgets-lib/widgets/order-commands/components/order-evaluation/order-evaluation';

@Component({
  selector: 'ats-edit-limit-order-form',
  templateUrl: './edit-limit-order-form.html',
  styleUrls: ['./edit-limit-order-form.less'],
  imports: [
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzColDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzTooltipDirective,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzCheckboxComponent,
    NzTypographyComponent,
    AsyncPipe,
    DecimalPipe,
    KeyValuePipe,
    InputNumber,
    ShortNumber,
    OrderEvaluation
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EditLimitOrderForm extends BaseEditOrderForm implements OnInit, OnDestroy {
  timeInForceEnum = TimeInForce;

  currentOrder$!: Observable<Order>;

  readonly evaluationRequest$ = new BehaviorSubject<SingleOrderEvaluation | null>(null);

  currentPriceDiffPercent$!: Observable<{ percent: number, sign: number } | null>;

  readonly initialValues = input<{
    price?: number;
    quantity?: number;
    hasPriceChanged?: boolean;
  } | null>(null);

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    quantity: this.formBuilder.nonNullable.control(
      1,
      {
        validators: [
          Validators.required,
          Validators.min(InputNumberValidation.minPositive),
          Validators.max(InputNumberValidation.max)
        ]
      }
    ),
    price: this.formBuilder.control<number | null>(null),
    timeInForce: this.formBuilder.control<TimeInForce | null>(null),
    isIceberg: this.formBuilder.nonNullable.control(false),
    icebergFixed: this.formBuilder.control<number | null>(
      null,
      {
        validators: [
          Validators.min(InputNumberValidation.minPositive),
          Validators.max(InputNumberValidation.max)
        ]
      }
    ),
    icebergVariance: this.formBuilder.control<number | null>(
      null,
      {
        validators: [
          Validators.min(InputNumberValidation.minPositive),
          Validators.max(InputNumberValidation.max)
        ]
      }
    )
  });

  private readonly orderDetailsService = inject(OrderDetailsService);

  private readonly commonParametersService = inject(CommonParametersService);

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly orderCommandService = inject(ConfirmableOrderCommandsService);

  ngOnInit(): void {
    this.currentOrder$ = combineLatest({
      orderId: this.orderIdChanges$,
      portfolioKey: this.portfolioKeyChanges$
    }).pipe(
      filter(x => x.orderId != null && x.portfolioKey != null),
      switchMap(x => this.orderDetailsService.getLimitOrderDetails(x.orderId!, x.portfolioKey!)),
      filter((o): o is Order => o != null),
      shareReplay(1)
    );

    this.initFormInstrument(this.currentOrder$);
    this.initOrderChange();
    this.initCommonParametersUpdate();
    this.initPriceDiffCalculation();
    this.initEvaluationUpdate();
    this.initFormFieldsCheck();
    this.initFormStateChangeNotification();
  }

  ngOnDestroy(): void {
    this.evaluationRequest$.complete();
  }

  setQuantity(value: number): void {
    this.commonParametersService.setParameters({
      quantity: value
    });
  }

  private initOrderChange(): void {
    combineLatest({
      currentOrder: this.currentOrder$,
      currentInstrument: this.formInstrument$
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      this.form.reset(undefined, {emitEvent: true});

      this.form.controls.price.clearValidators();
      this.form.controls.price.addValidators([
        Validators.required,
        Validators.min(InputNumberValidation.minNegative),
        Validators.max(InputNumberValidation.max),
        priceStepMultiplicity(x.currentInstrument.minstep)
      ]);

      const initialValues = this.initialValues();
      this.form.controls.price.setValue(initialValues?.price ?? x.currentOrder.price);
      this.form.controls.quantity.setValue(initialValues?.quantity ?? (x.currentOrder.qty - (x.currentOrder.filledQtyBatch ?? 0)));

      this.form.controls.timeInForce.setValue(x.currentOrder.timeInForce ?? null);

      if (x.currentOrder.iceberg) {
        this.form.controls.isIceberg.setValue(true);
        if (x.currentOrder.iceberg.creationFixedQuantity ?? 0) {
          this.form.controls.icebergFixed.setValue(x.currentOrder.iceberg.creationFixedQuantity!);
        }

        if (x.currentOrder.iceberg.creationVarianceQuantity ?? 0) {
          this.form.controls.icebergVariance.setValue(x.currentOrder.iceberg.creationVarianceQuantity!);
        }
      }

      this.form.clearValidators();
      this.form.addValidators([
        notBiggerThan('icebergFixed', 'quantity', () => this.form.controls.isIceberg.value)
      ]);

      this.checkFieldsAvailability();
    });
  }

  private initCommonParametersUpdate(): void {
    this.commonParametersService.parameters$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(p => {
      if (p.price != null && this.form.controls.price.value !== p.price) {
        this.form.controls.price.setValue(p.price);
      }

      if (p.quantity != null && this.form.controls.quantity.value !== p.quantity) {
        this.form.controls.quantity.setValue(p.quantity);
      }
    });

    this.form.valueChanges.pipe(
      map(v => ({quantity: v.quantity, price: v.price})),
      distinctUntilChanged((prev, curr) => prev.price === curr.price && prev.quantity === curr.quantity),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      this.commonParametersService.setParameters({
        price: x.price,
        quantity: x.quantity
      });
    });
  }

  private initEvaluationUpdate(): void {
    const formChanges$ = this.form.valueChanges.pipe(
      map(v => ({quantity: v.quantity, price: v.price})),
      distinctUntilChanged((prev, curr) => prev.price === curr.price && prev.quantity === curr.quantity),
      startWith(null)
    );

    const positionChanges$ = this.getInstrumentWithPortfolio().pipe(
      switchMap(x => this.portfolioSubscriptionsService.getInstrumentPositionSubscription(x.portfolioKey, x.instrument)),
      map(p => p?.qtyTFutureBatch ?? 0),
      distinctUntilChanged((prev, curr) => prev === curr),
      startWith(0)
    );

    combineLatest([
      formChanges$,
      positionChanges$
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(500),
    ).subscribe(() => this.updateEvaluation());
  }

  private updateEvaluation(): void {
    this.getInstrumentWithPortfolio().pipe(
      take(1)
    ).subscribe(x => {
      const formValue = this.form.value;
      if (!(formValue.price ?? 0) || !(formValue.quantity ?? 0)) {
        this.evaluationRequest$.next(null);
        return;
      }

      this.evaluationRequest$.next({
        portfolio: x.portfolioKey.portfolio,
        instrument: {
          ...InstrumentKeyHelper.toInstrumentKey(x.instrument),
          instrumentGroup: x.instrument.instrumentGroup
        },
        instrumentCurrency: x.instrument.currency,
        price: formValue.price as number,
        lotQuantity: formValue.quantity as number
      });
    });
  }

  private initFormFieldsCheck(): void {
    this.form.valueChanges.pipe(
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.checkFieldsAvailability());
  }

  private checkFieldsAvailability(): void {
    if (this.form.controls.isIceberg.enabled && this.form.controls.isIceberg.value) {
      this.enableControl(this.form.controls.icebergFixed);
      this.enableControl(this.form.controls.icebergVariance);
    } else {
      this.disableControl(this.form.controls.icebergFixed);
      this.disableControl(this.form.controls.icebergVariance);
    }

    this.form.updateValueAndValidity();
  }

  private initPriceDiffCalculation(): void {
    this.currentPriceDiffPercent$ = PriceDiffHelper.getPriceDiffCalculation(
      this.form.controls.price,
      this.getInstrumentWithPortfolio(),
      this.portfolioSubscriptionsService
    );
  }

  private initFormStateChangeNotification(): void {
    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      if (this.form.valid) {
        this.formStateChanged.emit({
          isValid: true,
          submit: () => this.prepareUpdateStream()
        });
      } else {
        this.formStateChanged.emit({
          isValid: false
        });
      }
    });
  }

  private prepareUpdateStream(): Observable<boolean> {
    return combineLatest({
      currentOrder: this.currentOrder$,
      portfolioKey: this.portfolioKeyChanges$
    }).pipe(
      filter(x => !!(x.currentOrder as Order | null) && !!x.portfolioKey),
      filter(() => this.form.valid),
      map(x => {
        const formValue = this.form.value;

        const updatedOrder = {
          orderId: x.currentOrder.id,
          instrument: x.currentOrder.targetInstrument,
          side: x.currentOrder.side,
          price: Number(formValue.price),
          quantity: Number(formValue.quantity)
        } as LimitOrderEdit;

        if (formValue.timeInForce != null) {
          updatedOrder.timeInForce = formValue.timeInForce;
        }

        if (formValue.icebergFixed ?? 0) {
          updatedOrder.icebergFixed = Number(formValue.icebergFixed);
        }

        if (formValue.icebergVariance ?? 0) {
          updatedOrder.icebergVariance = Number(formValue.icebergVariance);
        }

        return {
          updatedOrder,
          portfolio: x.portfolioKey!
        };
      }),
      take(1),
      switchMap(x => this.orderCommandService.submitLimitOrderEdit(x.updatedOrder, x.portfolio)),
      map(r => r.isSuccess),
      take(1)
    );
  }
}
