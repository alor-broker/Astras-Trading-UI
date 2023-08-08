import {
  Component, DestroyRef, Input,
  OnDestroy
} from "@angular/core";
import { OrderFormBaseComponent } from "../order-form-base.component";
import {
  FormControl,
  FormGroup,
  Validators
} from "@angular/forms";
import { Instrument } from "../../../../../shared/models/instruments/instrument.model";
import { LimitOrder } from "../../../../command/models/order.model";
import {
  BehaviorSubject,
  filter,
  Observable,
  take,
  distinctUntilChanged
} from "rxjs";
import { InstrumentKey } from "../../../../../shared/models/instruments/instrument-key.model";
import { inputNumberValidation } from "../../../../../shared/utils/validation-options";
import { ControlsOf } from '../../../../../shared/models/form.model';
import { AtsValidators } from "../../../../../shared/utils/form-validators";
import {
  OrderFormUpdate,
  OrderType
} from '../../../models/order-form.model';
import { EvaluationBaseProperties } from '../../../../../shared/models/evaluation-base-properties.model';
import { TimeInForce } from "../../../../../shared/models/commands/command-params.model";
import { Side } from "../../../../../shared/models/enums/side.model";
import { Position } from "../../../../../shared/models/positions/position.model";

export type LimitOrderFormValue = Omit<LimitOrder, 'instrument' | 'side'> & {
  instrumentGroup: string;
  isIceberg?: boolean;
  timeInForce?: TimeInForce;
  icebergFixed?: number;
  icebergVariance?: number;
  topOrderPrice?: number | null;
  topOrderSide?: Side;
  bottomOrderPrice?: number | null;
  bottomOrderSide?: Side;
};

@Component({
  selector: 'ats-limit-order-form[instrument]',
  templateUrl: './limit-order-form.component.html',
  styleUrls: ['./limit-order-form.component.less']
})
export class LimitOrderFormComponent extends OrderFormBaseComponent<LimitOrderFormValue> implements OnDestroy {
  evaluationSubject = new BehaviorSubject<EvaluationBaseProperties | null>(null);
  evaluation$?: Observable<EvaluationBaseProperties | null>;
  timeInForceEnum = TimeInForce;

  @Input({required: true}) position!: Position | null;

  constructor(protected readonly destroyRef: DestroyRef) {
    super(destroyRef);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.evaluationSubject.complete();
  }

  quantitySelect(qty: number) {
    this.form?.get('quantity')?.setValue(qty);
  }

  isPriceDifferenceNeeded(): boolean {
    return !!this.position?.avgPrice && (this.form?.get('price')?.value != null);
  }

  getPriceDifferenceClass(): string | null {
    return this.isPriceDifferenceNeeded()
      ? this.getPriceDifference() > 0
        ? 'profit'
        : 'loss'
      : null;
  }

  getAbsPriceDifference(): number {
    return Math.abs(this.getPriceDifference());
  }

  private getPriceDifference() {
    return ((this.form!.get('price')!.value! / this.position!.avgPrice) - 1) * 100;
  }

  protected buildForm(instrument: Instrument): FormGroup<ControlsOf<LimitOrderFormValue>> {
    return new FormGroup<ControlsOf<LimitOrderFormValue>>({
        quantity: new FormControl(
          1,
          [
            Validators.required,
            Validators.min(inputNumberValidation.min),
            Validators.max(inputNumberValidation.max),
          ]
        ),
        price: new FormControl(
          null,
          [
            Validators.required,
            Validators.min(inputNumberValidation.negativeMin),
            Validators.max(inputNumberValidation.max),
            AtsValidators.priceStepMultiplicity(instrument!.minstep)
          ]
        ),
        instrumentGroup: new FormControl(instrument.instrumentGroup ?? ''),
        timeInForce: new FormControl(null),
        isIceberg: new FormControl(false),
        icebergFixed: new FormControl(null, Validators.min(inputNumberValidation.min)),
        icebergVariance: new FormControl(null, [
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]),
        topOrderPrice: new FormControl(null, [
          Validators.min(inputNumberValidation.negativeMin),
          Validators.max(inputNumberValidation.max)
        ]),
        topOrderSide: new FormControl(Side.Buy),
        bottomOrderPrice: new FormControl(null, [
          Validators.min(inputNumberValidation.negativeMin),
          Validators.max(inputNumberValidation.max)
        ]),
        bottomOrderSide: new FormControl(Side.Buy),
      },
      AtsValidators.notBiggerThan('icebergFixed', 'quantity', () => !!this.form?.get('isIceberg')?.value)
    );
  }

  protected getFormValue(): LimitOrderFormValue | null {
    if (!super.getFormValue()) {
      return null;
    }

    let formValue = { ...super.getFormValue()! };

    if (!formValue.isIceberg) {
      delete formValue.icebergFixed;
      delete formValue.icebergVariance;
    } else {
      formValue = {
        ...formValue,
        icebergFixed: Number(formValue.icebergFixed),
        icebergVariance: Number(formValue.icebergVariance)
      };
    }

    delete formValue.isIceberg;

    if (!formValue.timeInForce) {
      delete formValue.timeInForce;
    }

    return {
      ...formValue,
      quantity: Number(formValue.quantity),
      price: Number(formValue.price),
    };
  }

  protected onFormValueEmitted(value: LimitOrderFormValue | null) {
    if (!value) {
      this.evaluationSubject.next(null);
      return;
    }

    this.instrument$.pipe(
      filter((i): i is Instrument => !!i),
      take(1)
    ).subscribe(instrument => {
      this.evaluationSubject.next({
        price: Number(value.price),
        lotQuantity: value.quantity,
        instrument: {
          symbol: instrument.symbol,
          exchange: instrument.exchange,
          instrumentGroup: value.instrumentGroup ?? instrument.instrumentGroup
        } as InstrumentKey,
        instrumentCurrency: instrument.currency
      });
    });
  }

  protected applyInitialValues(values: OrderFormUpdate<LimitOrderFormValue>) {
    if(!!values?.target && values.target !== OrderType.LimitOrder) {
      return;
    }

    if (!!values?.price && values.price !== Number(this.form?.get('price')?.value ?? 0)) {
      this.form?.controls.price.setValue(values.price);
    }
    if (!!values?.quantity && values.quantity !== Number(this.form?.get('quantity')?.value ?? 0)) {
      this.form?.controls.quantity.setValue(values.quantity);
    }
  }

  protected onFormCreated() {
    this.evaluation$ = this.evaluationSubject.asObservable()
      .pipe(
        distinctUntilChanged((prev, curr) =>
          JSON.stringify(prev) === JSON.stringify(curr)
        )
      );
  }
}
