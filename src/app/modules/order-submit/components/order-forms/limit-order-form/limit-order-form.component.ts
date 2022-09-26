import { Component, OnDestroy, OnInit } from "@angular/core";
import { OrderFormBaseComponent } from "../order-form-base.component";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { LimitFormControls, LimitFormGroup } from "../../../../command/models/command-forms.model";
import { Instrument } from "../../../../../shared/models/instruments/instrument.model";
import { LimitOrder } from "../../../../command/models/order.model";
import { BehaviorSubject, filter, take, takeUntil, withLatestFrom } from "rxjs";
import { EvaluationBaseProperties } from "../../../../command/models/evaluation-base-properties.model";
import { InstrumentKey } from "../../../../../shared/models/instruments/instrument-key.model";
import { WidgetSettingsService } from "../../../../../shared/services/widget-settings.service";
import { OrderbookOrdersService } from "../../../../orderbook/services/orderbook-orders.service";

export type LimitOrderFormValue = Omit<LimitOrder, 'instrument' | 'side'> & { instrumentGroup: string };

@Component({
  selector: 'ats-limit-order-form[instrument]',
  templateUrl: './limit-order-form.component.html',
  styleUrls: ['./limit-order-form.component.less']
})
export class LimitOrderFormComponent extends OrderFormBaseComponent<LimitOrderFormValue> implements OnInit, OnDestroy {
  evaluation$ = new BehaviorSubject<EvaluationBaseProperties | null>(null);

  constructor(
    private readonly orderbookOrdersService: OrderbookOrdersService,
    private readonly settingsService: WidgetSettingsService
  ) {
    super();
  }

  ngOnInit() {
    super.ngOnInit();

    this.orderbookOrdersService.selectedOrderPrice
      .pipe(
        takeUntil(this.destroy$),
        withLatestFrom(
          this.settingsService!.getSettings(this.guid!),
          this.isActivated$
        ),
        filter(([priceInfo, settings, isActivated]) => priceInfo.badgeColor === settings.badgeColor && isActivated)
      )
      .subscribe(([priceInfo]) => {
        this.form?.get('price')?.setValue(priceInfo.price);
      });
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.evaluation$.complete();
  }

  protected buildForm(instrument: Instrument): FormGroup {
    return new FormGroup({
      quantity: new FormControl(
        1,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(1000000000)
        ]
      ),
      price: new FormControl(
        1,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(1000000000)
        ]
      ),
      instrumentGroup: new FormControl(instrument.instrumentGroup),
    } as LimitFormControls) as LimitFormGroup;
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
}
