import {
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { BaseEditOrderFormComponent } from "../base-edit-order-form.component";
import { FormBuilder, Validators } from "@angular/forms";
import { CommonParametersService } from "../../../services/common-parameters.service";
import { PortfolioSubscriptionsService } from "../../../../../shared/services/portfolio-subscriptions.service";
import { inputNumberValidation } from "../../../../../shared/utils/validation-options";
import { Order, TimeInForce } from "../../../../../shared/models/orders/order.model";
import { debounceTime, filter, map, startWith, switchMap } from "rxjs/operators";
import { OrderDetailsService } from "../../../../../shared/services/orders/order-details.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BehaviorSubject, combineLatest, distinctUntilChanged, Observable, shareReplay, take } from "rxjs";
import { InstrumentsService } from "../../../../instruments/services/instruments.service";
import { AtsValidators } from "../../../../../shared/utils/form-validators";
import { EvaluationBaseProperties } from "../../../../../shared/models/evaluation-base-properties.model";
import { PriceDiffHelper } from "../../../utils/price-diff.helper";
import { LimitOrderEdit } from "../../../../../shared/models/orders/edit-order.model";
import { toInstrumentKey } from "../../../../../shared/utils/instruments";
import {ConfirmableOrderCommandsService} from "../../../services/confirmable-order-commands.service";

@Component({
    selector: 'ats-edit-limit-order-form',
    templateUrl: './edit-limit-order-form.component.html',
    styleUrls: ['./edit-limit-order-form.component.less'],
    standalone: false
})
export class EditLimitOrderFormComponent extends BaseEditOrderFormComponent implements OnInit, OnDestroy {
  timeInForceEnum = TimeInForce;
  currentOrder$!: Observable<Order>;
  readonly evaluationRequest$ = new BehaviorSubject<EvaluationBaseProperties | null>(null);
  currentPriceDiffPercent$!: Observable<{ percent: number, sign: number } | null>;

  @Input()
  initialValues: {
    price?: number;
    quantity?: number;
    hasPriceChanged?: boolean;
  } | null = null;

  form = this.formBuilder.group({
    quantity: this.formBuilder.nonNullable.control(
      1,
      {
        validators: [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
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
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      }
    ),
    icebergVariance: this.formBuilder.control<number | null>(
      null,
      {
        validators: [
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      }
    )
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly orderDetailsService: OrderDetailsService,
    protected readonly instrumentService: InstrumentsService,
    private readonly commonParametersService: CommonParametersService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly orderCommandService: ConfirmableOrderCommandsService,
    protected readonly destroyRef: DestroyRef) {
    super(instrumentService, destroyRef);
  }

  ngOnInit(): void {
    this.currentOrder$ = combineLatest({
      orderId: this.orderId$,
      portfolioKey: this.portfolioKey$
    }).pipe(
      filter(x => x.orderId != null && x.portfolioKey != null),
      switchMap(x => this.orderDetailsService.getLimitOrderDetails(x.orderId!, x.portfolioKey!)),
      filter((o): o is Order => !!o),
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
    super.ngOnDestroy();
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
        Validators.min(inputNumberValidation.negativeMin),
        Validators.max(inputNumberValidation.max),
        AtsValidators.priceStepMultiplicity(x.currentInstrument.minstep)
      ]);

      this.form.controls.price.setValue(this.initialValues?.price ?? x.currentOrder.price);
      this.form.controls.quantity.setValue(this.initialValues?.quantity ?? (x.currentOrder.qty - (x.currentOrder.filledQtyBatch ?? 0)));

      this.form.controls.timeInForce.setValue(x.currentOrder.timeInForce ?? null);

      if (!!x.currentOrder.iceberg) {
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
        AtsValidators.notBiggerThan('icebergFixed', 'quantity', () => this.form.controls.isIceberg.value)
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
          ...toInstrumentKey(x.instrument),
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
      portfolioKey: this.portfolioKey$
    }).pipe(
      filter(x => !!(x.currentOrder as Order | null) && !!x.portfolioKey),
      filter(() => this.form.valid),
      map(x => {
        const formValue = this.form.value;

        const updatedOrder = {
          orderId: x.currentOrder.id,
          instrument: x.currentOrder.targetInstrument,
          side:  x.currentOrder.side,
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
