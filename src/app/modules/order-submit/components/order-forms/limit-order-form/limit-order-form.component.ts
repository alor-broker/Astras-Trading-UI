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
  take
} from "rxjs";
import { EvaluationBaseProperties } from "../../../../command/models/evaluation-base-properties.model";
import { InstrumentKey } from "../../../../../shared/models/instruments/instrument-key.model";
import { inputNumberValidation } from "../../../../../shared/utils/validation-options";
import { ControlsOf } from '../../../../../shared/models/form.model';

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

  protected buildForm(instrument: Instrument): FormGroup<ControlsOf<LimitOrderFormValue>> {
    return new FormGroup<ControlsOf<LimitOrderFormValue>>({
      quantity: new FormControl(
        1,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]
      ),
      price: new FormControl(
        1,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
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

    if (!parseFloat(formValue.price.toString())) {
      this.form?.get('price')?.setValue(null);
      return null;
    }

    return {
      ...formValue,
      quantity: Number(formValue.quantity),
      price: parseFloat(formValue.price.toString()),
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
        price: parseFloat(value.price.toString()),
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

  protected applyInitialValues(values: Partial<LimitOrderFormValue> | null) {
    if (!!values && !!values.price && this.form) {
      this.form.controls.price.setValue(values.price);
    }
  }
}
