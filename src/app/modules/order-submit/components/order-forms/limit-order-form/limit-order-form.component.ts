import {
  Component,
  OnDestroy
} from "@angular/core";
import { OrderFormBaseComponent } from "../order-form-base.component";
import {
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators
} from "@angular/forms";
import { Instrument } from "../../../../../shared/models/instruments/instrument.model";
import { LimitOrder } from "../../../../command/models/order.model";
import {
  BehaviorSubject,
  filter,
  take,
  takeUntil
} from "rxjs";
import { EvaluationBaseProperties } from "../../../../command/models/evaluation-base-properties.model";
import { InstrumentKey } from "../../../../../shared/models/instruments/instrument-key.model";
import { inputNumberValidation } from "../../../../../shared/utils/validation-options";
import { ControlsOf } from '../../../../../shared/models/form.model';
import { AtsValidators } from "../../../../../shared/utils/form-validators";

export type LimitOrderFormValue = Omit<LimitOrder, 'instrument' | 'side'> & { instrumentGroup: string };

@Component({
  selector: 'ats-limit-order-form[instrument]',
  templateUrl: './limit-order-form.component.html',
  styleUrls: ['./limit-order-form.component.less']
})
export class LimitOrderFormComponent extends OrderFormBaseComponent<LimitOrderFormValue> implements OnDestroy {
  private priceStepMultiplicityFn: ValidatorFn | null = null;
  evaluation$ = new BehaviorSubject<EvaluationBaseProperties | null>(null);

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.evaluation$.complete();
  }

  protected onFormCreated() {
    this.subscribeToInstrumentChange();
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
        price: value.price,
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

  private subscribeToInstrumentChange() {
    this.instrument$
      .pipe(takeUntil(this.destroy$))
      .subscribe(instrument => {
        const priceCtrl = this.form?.get('price');

        if (priceCtrl) {
          if (this.priceStepMultiplicityFn && priceCtrl.hasValidator(this.priceStepMultiplicityFn)) {
            priceCtrl.removeValidators(this.priceStepMultiplicityFn);
          }
          this.priceStepMultiplicityFn = AtsValidators.priceStepMultiplicity(instrument!.minstep);
          priceCtrl.addValidators(this.priceStepMultiplicityFn);
          priceCtrl.updateValueAndValidity();
        }
      });
  }
}
