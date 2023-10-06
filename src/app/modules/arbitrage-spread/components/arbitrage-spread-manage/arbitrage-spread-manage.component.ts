import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ValidatorFn, Validators } from "@angular/forms";
import { ArbitrageSpread, SpreadLeg } from "../../models/arbitrage-spread.model";
import { map } from "rxjs/operators";
import { Observable, shareReplay, Subscription } from "rxjs";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { isPortfoliosEqual } from "../../../../shared/utils/portfolios";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";
import { Side } from "../../../../shared/models/enums/side.model";
import { AtsValidators } from "../../../../shared/utils/form-validators";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";

interface SpreadFormGroup {
  id: FormControl;
  calculationFormula: FormControl;
  firstLeg: FormGroup<SpreadLegFormGroup>;
  secondLeg: FormGroup<SpreadLegWithSideFormGroup>;
  isThirdLeg: FormControl;
  thirdLeg: FormGroup<SpreadLegWithSideFormGroup>;
}

interface SpreadLegFormGroup {
  instrument: FormControl;
  quantity: FormControl;
  ratio: FormControl;
  portfolio: FormControl;
}

interface SpreadLegWithSideFormGroup extends SpreadLegFormGroup {
  side: FormControl;
}

const CALCULATION_FORMULA_PATTERN = /^(?:L[1-3]|\d+(.\d+)?)(?:[-+*\/](?:L[1-3]|\d+(.\d+)?))*$/g;

const calculationFormulaValidator: ValidatorFn = (form) => {
  if (
    !form.get('calculationFormula')?.errors?.pattern &&
    !form.get('isThirdLeg')?.value &&
    form.get('calculationFormula')?.value?.includes('L3')
  ) {
    return {
      calculationFormula: true
    };
  }

  return null;
};

@Component({
  selector: 'ats-arbitrage-spread-manage',
  templateUrl: './arbitrage-spread-manage.component.html',
  styleUrls: ['./arbitrage-spread-manage.component.less']
})
export class ArbitrageSpreadManageComponent implements OnInit, OnDestroy {
  @Input() spread?: ArbitrageSpread | null;
  @Output() formChange = new EventEmitter();

  isPortfoliosEqual = isPortfoliosEqual;

  portfolios$?: Observable<PortfolioKey[]>;
  sideEnum = Side;

  form = new FormGroup<SpreadFormGroup>({
    id: new FormControl(null),
    calculationFormula: new FormControl('L1-L2', Validators.pattern(CALCULATION_FORMULA_PATTERN)),
    firstLeg: new FormGroup({
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
    }),
    secondLeg: new FormGroup({
      instrument: new FormControl(null, [
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
      portfolio: new FormControl(null, Validators.required),
      side: new FormControl(Side.Sell)
    }),
    isThirdLeg: new FormControl(false),
    thirdLeg: new FormGroup({
      instrument: new FormControl(null, [
      ]),
      quantity: new FormControl(null, [
        Validators.min(inputNumberValidation.min),
        Validators.max(inputNumberValidation.max)
      ]),
      ratio: new FormControl(1, [
        Validators.min(inputNumberValidation.min),
        Validators.max(inputNumberValidation.max)
      ]),
      portfolio: new FormControl(null),
      side: new FormControl(Side.Buy)
    })
  },
    [
      AtsValidators.requiredIfTrue('isThirdLeg', 'thirdLeg.instrument'),
      AtsValidators.requiredIfTrue('isThirdLeg', 'thirdLeg.quantity'),
      AtsValidators.requiredIfTrue('isThirdLeg', 'thirdLeg.ratio'),
      AtsValidators.requiredIfTrue('isThirdLeg', 'thirdLeg.portfolio'),
      AtsValidators.requiredIfTrue('isThirdLeg', 'thirdLeg.side'),
      calculationFormulaValidator
    ]);

  formChangeSub?: Subscription;

  get calculationFormulaControl(): FormControl {
    return this.form.get('calculationFormula') as FormControl;
  }

  get firstLegFormGroup(): FormGroup<SpreadLegFormGroup> {
    return this.form.get('firstLeg') as FormGroup<SpreadLegFormGroup>;
  }

  get secondLegFormGroup(): FormGroup<SpreadLegWithSideFormGroup> {
    return this.form.get('secondLeg') as FormGroup<SpreadLegWithSideFormGroup>;
  }

  get thirdLegFormGroup(): FormGroup<SpreadLegWithSideFormGroup> {
    return this.form.get('thirdLeg') as FormGroup<SpreadLegWithSideFormGroup>;
  }

  get isThirdLegControl(): FormControl<boolean> {
    return this.form.get('isThirdLeg') as FormControl<boolean>;
  }

  constructor(
    private readonly userPortfoliosService: UserPortfoliosService
  ) {
  }

  ngOnInit() {
    this.portfolios$ = this.userPortfoliosService.getPortfolios()
      .pipe(
        map(portfolios => portfolios.map(p => ({ portfolio: p.portfolio, exchange: p.exchange }))),
        shareReplay(1)
      );

    if (this.spread) {
      this.form.get('calculationFormula')?.setValue(this.spread.calculationFormula);
      this.form.get('firstLeg')?.patchValue(this.spread.firstLeg);
      this.form.get('secondLeg')?.patchValue(this.spread.secondLeg as SpreadLeg & {side: Side});

      if (this.spread.isThirdLeg) {
        this.form.get('isThirdLeg')?.setValue(true);
        this.form.get('thirdLeg')?.patchValue(this.spread.thirdLeg as SpreadLeg & {side: Side});
      }

      this.form.get('id')?.patchValue(this.spread.id);
    }

    this.formChangeSub = this.form.valueChanges.subscribe(() => {
      this.formChange.emit({
        value: this.form.value,
        isValid: this.form.valid
      });
    });
  }

  ngOnDestroy() {
    this.formChangeSub?.unsubscribe();
  }

  getAvailablePortfolios(allPortfolios: PortfolioKey[], legNumber = 1) {
    let selectedInstrument: InstrumentKey;
    switch (legNumber) {
      case 1:
        selectedInstrument = this.firstLegFormGroup?.get('instrument')?.value;
        break;
      case 2:
        selectedInstrument = this.secondLegFormGroup?.get('instrument')?.value;
        break;
      case 3:
        selectedInstrument = this.thirdLegFormGroup?.get('instrument')?.value;
        break;
      default:
        selectedInstrument = this.firstLegFormGroup?.get('instrument')?.value;
        break;
    }

    if (!selectedInstrument) {
      return [];
    }

    return allPortfolios.filter(p => p.exchange === selectedInstrument.exchange);
  }

  instrumentChange(legNumber = 1) {
    switch (legNumber) {
      case 1:
        this.firstLegFormGroup.get('portfolio')?.reset();
        break;
      case 2:
        this.secondLegFormGroup.get('portfolio')?.reset();
        break;
      case 3:
        this.thirdLegFormGroup.get('portfolio')?.reset();
        break;
    }
  }
}
