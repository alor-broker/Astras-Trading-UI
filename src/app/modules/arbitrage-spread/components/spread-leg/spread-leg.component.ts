import { Component, DestroyRef, Input, OnInit } from '@angular/core';
import {
  ControlValueAccessorBaseComponent
} from "../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component";
import {
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR, ValidationErrors,
  Validator,
  Validators
} from "@angular/forms";
import { SpreadLeg } from "../../models/arbitrage-spread.model";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { Side } from "../../../../shared/models/enums/side.model";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { isPortfoliosEqual } from "../../../../shared/utils/portfolios";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";

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

  form = new FormGroup({
    instrument: new FormControl<Instrument | null>(null, [
      Validators.required,
    ]),
    quantity: new FormControl(1, [
      Validators.required,
      Validators.min(inputNumberValidation.min),
      Validators.max(inputNumberValidation.max)
    ]),
    ratio: new FormControl(1, [
      Validators.required,
      Validators.min(inputNumberValidation.min),
      Validators.max(inputNumberValidation.max)
    ]),
    portfolio: new FormControl<PortfolioKey | null>(null, Validators.required),
    side: new FormControl(Side.Sell)
  });

  isPortfoliosEqual = isPortfoliosEqual;
  sideEnum = Side;

  constructor(
    private readonly destroyRef: DestroyRef
  ) {
    super();
  }

  ngOnInit(): void {
    if (!this.isSideNeeded) {
      this.form.controls.side.disable();
    }

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emitValue(<SpreadLeg>this.form.value));
  }

  getAvailablePortfolios(): PortfolioKey[] {
    const selectedInstrument = this.form.get('instrument')?.value;

    if (!selectedInstrument) {
      return [];
    }

    return this.portfolios.filter(p => p.exchange === selectedInstrument.exchange);
  }

  instrumentChange(): void {
    this.form.controls.portfolio.reset();
  }

  protected needMarkTouched(): boolean {
    return this.form.touched;
  }

  writeValue(obj: any): void {
    this.form.patchValue(obj);
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  validate(): ValidationErrors | null {
    return (this.form.disabled || this.form.valid) ? null : { required: true };
  }
}
