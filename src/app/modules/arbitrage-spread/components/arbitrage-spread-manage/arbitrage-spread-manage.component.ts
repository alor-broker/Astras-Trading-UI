import { Component, DestroyRef, OnInit, input, output, inject } from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators} from "@angular/forms";
import {ArbitrageSpread} from "../../models/arbitrage-spread.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {map} from "rxjs/operators";
import {Observable, shareReplay} from "rxjs";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzFormControlComponent, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzInputDirective, NzInputGroupComponent, NzInputGroupWhitSuffixOrPrefixDirective} from 'ng-zorro-antd/input';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {SpreadLegComponent} from '../spread-leg/spread-leg.component';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
import {AsyncPipe} from '@angular/common';

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
  styleUrls: ['./arbitrage-spread-manage.component.less'],
  imports: [
    TranslocoDirective,
    FormsModule,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    NzFormLabelComponent,
    NzInputGroupComponent,
    NzInputGroupWhitSuffixOrPrefixDirective,
    NzInputDirective,
    NzIconDirective,
    NzTooltipDirective,
    NzTypographyComponent,
    SpreadLegComponent,
    NzSwitchComponent,
    AsyncPipe
  ]
})
export class ArbitrageSpreadManageComponent implements OnInit {
  private readonly userPortfoliosService = inject(UserPortfoliosService);
  private readonly destroyRef = inject(DestroyRef);

  readonly spread = input<ArbitrageSpread | null>();
  readonly formChange = output<{ value: ArbitrageSpread, isValid: boolean }>();

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
    return this.form.controls.calculationFormula as FormControl;
  }

  get isThirdLegControl(): FormControl<boolean> {
    return this.form.controls.isThirdLeg as FormControl<boolean>;
  }

  ngOnInit(): void {
    this.portfolios$ = this.userPortfoliosService.getPortfolios()
      .pipe(
        map(portfolios => portfolios.map(p => ({portfolio: p.portfolio, exchange: p.exchange}))),
        shareReplay(1)
      );

    this.form.controls.thirdLeg.disable();

    const spread = this.spread();
    if (spread) {
      this.form.controls.calculationFormula.setValue(spread.calculationFormula ?? 'L1-L2');
      this.form.controls.firstLeg.setValue(spread.firstLeg);
      this.form.controls.secondLeg.setValue(spread.secondLeg);

      if (spread.isThirdLeg) {
        this.form.controls.isThirdLeg.setValue(true);
        this.form.controls.thirdLeg.enable();
        this.form.controls.thirdLeg.setValue(spread.thirdLeg);
      }

      this.form.controls.id.patchValue(spread.id);
    }

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formChange.emit({
          value: this.form.value as ArbitrageSpread,
          isValid: this.form.valid
        });
      });

    this.isThirdLegControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: boolean) => {
        if (value) {
          this.form.controls.thirdLeg.enable();
        } else {
          this.form.controls.thirdLeg.disable();
        }
      });
  }
}
