import {
  Component,
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
  take,
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

export type LimitOrderFormValue = Omit<LimitOrder, 'instrument' | 'side'> & { instrumentGroup: string };

@Component({
  selector: 'ats-limit-order-form[instrument]',
  templateUrl: './limit-order-form.component.html',
  styleUrls: ['./limit-order-form.component.less']
})
export class LimitOrderFormComponent extends OrderFormBaseComponent<LimitOrderFormValue> implements OnDestroy {
  evaluation$ = new BehaviorSubject<EvaluationBaseProperties | null>(null);

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.evaluation$.complete();
  }

  quantitySelect(qty: number) {
    this.form?.get('quantity')?.setValue(qty);
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
        1,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max),
          AtsValidators.priceStepMultiplicity(instrument!.minstep)
        ]
      ),
      instrumentGroup: new FormControl(instrument.instrumentGroup ?? ''),
    });
  }

  protected getFormValue(): LimitOrderFormValue | null {
    const formValue = super.getFormValue();
    if (!formValue) {
      return formValue;
    }

    return {
      ...formValue,
      quantity: Number(formValue.quantity),
      price: Number(formValue.price),
    };
  }

  protected onFormValueEmitted(value: LimitOrderFormValue | null) {
    if (!value) {
      this.evaluation$.next(null);
      return;
    }

    this.instrument$.pipe(
      filter((i): i is Instrument => !!i),
      take(1)
    ).subscribe(instrument => {
      this.evaluation$.next({
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
}
