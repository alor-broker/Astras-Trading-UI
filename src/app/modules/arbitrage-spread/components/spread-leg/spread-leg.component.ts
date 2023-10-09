import { Component, DestroyRef, Input, OnInit } from '@angular/core';
import {
  ControlValueAccessorBaseComponent
} from "../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component";
import {
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  UntypedFormControl,
  UntypedFormGroup, Validator,
  Validators
} from "@angular/forms";
import { SpreadLeg } from "../../models/arbitrage-spread.model";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { Side } from "../../../../shared/models/enums/side.model";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { isPortfoliosEqual } from "../../../../shared/utils/portfolios";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-spread-leg',
  templateUrl: './spread-leg.component.html',
  styleUrls: ['./spread-leg.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: SpreadLegComponent
    },
    {
      provide: NG_VALIDATORS,
      useExisting: SpreadLegComponent,
      multi: true,
    },
  ]
})
export class SpreadLegComponent extends ControlValueAccessorBaseComponent<SpreadLeg> implements OnInit, Validator {
  @Input() isSideNeeded = false;
  @Input() portfolios: PortfolioKey[] = [];

  form!: UntypedFormGroup;
  isPortfoliosEqual = isPortfoliosEqual;
  sideEnum = Side;

  constructor(
    private readonly destroyRef: DestroyRef
  ) {
    super();
  }

  ngOnInit() {
    this.form = new UntypedFormGroup({
      instrument: new FormControl<Instrument | null>(null, [
        Validators.required,
      ]),
      quantity: new FormControl(null, [
        Validators.required,
        Validators.min(inputNumberValidation.min),
        Validators.max(inputNumberValidation.max)
      ]),
      ratio: new FormControl(1, [
        Validators.required,
        Validators.min(inputNumberValidation.min),
        Validators.max(inputNumberValidation.max)
      ]),
      portfolio: new FormControl(null, Validators.required)
    });

    if (this.isSideNeeded) {
      this.form.addControl('side', new UntypedFormControl(Side.Sell));
    }

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emitValue(this.form.value));
  }

  getAvailablePortfolios(): PortfolioKey[] {
    const selectedInstrument = this.form?.get('instrument')?.value;

    if (!selectedInstrument) {
      return [];
    }

    return this.portfolios.filter(p => p.exchange === selectedInstrument.exchange);
  }

  instrumentChange() {
    this.form.get('portfolio')?.reset();
  }

  protected needMarkTouched(): boolean {
    return !!this.form?.touched;
  }

  writeValue(obj: any) {
    this.form.patchValue(obj);
  }

  setDisabledState(isDisabled: boolean) {
    isDisabled ? this.form.disable() : this.form.enable();
  }

  validate() {
    return (this.form.disabled || this.form.valid) ? null : { required: true };
  }
}
