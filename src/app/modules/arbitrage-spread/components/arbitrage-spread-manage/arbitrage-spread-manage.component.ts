import { Component, DestroyRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ValidatorFn, Validators } from "@angular/forms";
import { ArbitrageSpread } from "../../models/arbitrage-spread.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { map } from "rxjs/operators";
import { Observable, shareReplay } from "rxjs";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { UserPortfoliosService } from "../../../../shared/services/user-portfolios.service";

interface SpreadFormGroup {
  id: FormControl;
  calculationFormula: FormControl;
  firstLeg: FormControl;
  secondLeg: FormControl;
  isThirdLeg: FormControl;
  thirdLeg: FormControl;
}

const CALCULATION_FORMULA_PATTERN = /^(?:L[1-3]|\d+(.\d+)?)(?:[\-+*\/](?:L[1-3]|\d+(.\d+)?))*$/;

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
export class ArbitrageSpreadManageComponent implements OnInit {
  @Input() spread?: ArbitrageSpread | null;
  @Output() formChange = new EventEmitter();

  portfolios$?: Observable<PortfolioKey[]>;

  form = new FormGroup<SpreadFormGroup>({
    id: new FormControl(null),
    calculationFormula: new FormControl('L1-L2', Validators.pattern(CALCULATION_FORMULA_PATTERN)),
    firstLeg: new FormControl(null, Validators.required),
    secondLeg: new FormControl(null, Validators.required),
    isThirdLeg: new FormControl(false),
    thirdLeg: new FormControl(null, Validators.required)
  },
    [
      calculationFormulaValidator
    ]);

  get calculationFormulaControl(): FormControl {
    return this.form.get('calculationFormula') as FormControl;
  }

  get isThirdLegControl(): FormControl<boolean> {
    return this.form.get('isThirdLeg') as FormControl<boolean>;
  }

  constructor(
    private readonly userPortfoliosService: UserPortfoliosService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit() {
    this.portfolios$ = this.userPortfoliosService.getPortfolios()
      .pipe(
        map(portfolios => portfolios.map(p => ({ portfolio: p.portfolio, exchange: p.exchange }))),
        shareReplay(1)
      );

    this.form.get('thirdLeg')?.disable();

    if (this.spread) {
      this.form.get('calculationFormula')?.setValue(this.spread.calculationFormula ?? 'L1-L2');
      this.form.get('firstLeg')?.setValue(this.spread.firstLeg);
      this.form.get('secondLeg')?.setValue(this.spread.secondLeg);

      if (this.spread.isThirdLeg) {
        this.form.get('isThirdLeg')?.setValue(true);
        this.form.get('thirdLeg')?.enable();
        this.form.get('thirdLeg')?.setValue(this.spread.thirdLeg);
      }

      this.form.get('id')?.patchValue(this.spread.id);
    }

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formChange.emit({
          value: this.form.value,
          isValid: this.form.valid
        });
      });


    this.isThirdLegControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: boolean) => {
        if (value) {
          this.form.get('thirdLeg')!.enable();
        } else {
          this.form.get('thirdLeg')!.disable();
        }
      });
  }
}
