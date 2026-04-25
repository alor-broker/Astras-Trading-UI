import { Component, DestroyRef, OnInit, input, output, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from "@angular/forms";
import { ArbitrageRobot, RobotSpreadLeg } from "../../models/arbitrage-robot.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { map } from "rxjs/operators";
import { Observable, shareReplay } from "rxjs";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { UserPortfoliosService } from "../../../../shared/services/user-portfolios.service";
import { NzColDirective, NzRowDirective } from 'ng-zorro-antd/grid';
import { NzFormControlComponent, NzFormItemComponent, NzFormLabelComponent } from 'ng-zorro-antd/form';
import { NzInputDirective, NzInputGroupComponent, NzInputGroupWhitSuffixOrPrefixDirective } from 'ng-zorro-antd/input';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { NzTypographyComponent } from 'ng-zorro-antd/typography';
import { NzSwitchComponent } from 'ng-zorro-antd/switch';
import { AsyncPipe } from '@angular/common';
import { SpreadLegComponent } from '../../../arbitrage-spread/components/spread-leg/spread-leg.component';

interface RobotFormGroup {
  id: FormControl;
  calculationFormula: FormControl;
  firstLeg: FormControl;
  secondLeg: FormControl;
  isThirdLeg: FormControl;
  thirdLeg: FormControl;
}

const FORMULA_PATTERN = /^(?:L[1-3]|\d+(.\d+)?)(?:[-+*/](?:L[1-3]|\d+(.\d+)?))*$/;

const formulaValidator: ValidatorFn = (form) => {
  if (
    !form.get('calculationFormula')?.errors?.pattern &&
    !form.get('isThirdLeg')?.value &&
    form.get('calculationFormula')?.value?.includes('L3')
  ) {
    return { calculationFormula: true };
  }
  return null;
};

@Component({
  selector: 'ats-arbitrage-robot-manage',
  templateUrl: './arbitrage-robot-manage.component.html',
  styleUrls: ['./arbitrage-robot-manage.component.less'],
  imports: [
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
    NzSwitchComponent,
    AsyncPipe,
    SpreadLegComponent
  ]
})
export class ArbitrageRobotManageComponent implements OnInit {
  private readonly userPortfoliosService = inject(UserPortfoliosService);
  private readonly destroyRef = inject(DestroyRef);

  readonly spread = input<ArbitrageRobot | null>();
  readonly formChange = output<{ value: ArbitrageRobot, isValid: boolean }>();

  portfolios$?: Observable<PortfolioKey[]>;

  form = new FormGroup<RobotFormGroup>({
    id: new FormControl(null),
    calculationFormula: new FormControl('L1-L2', Validators.pattern(FORMULA_PATTERN)),
    firstLeg: new FormControl<RobotSpreadLeg | null>(null, Validators.required),
    secondLeg: new FormControl<RobotSpreadLeg | null>(null, Validators.required),
    isThirdLeg: new FormControl(false),
    thirdLeg: new FormControl<RobotSpreadLeg | null>(null, Validators.required),
  }, [formulaValidator]);

  get formulaControl(): FormControl {
    return this.form.controls.calculationFormula as FormControl;
  }

  get isThirdLegControl(): FormControl<boolean> {
    return this.form.controls.isThirdLeg as FormControl<boolean>;
  }

  ngOnInit(): void {
    this.portfolios$ = this.userPortfoliosService.getPortfolios().pipe(
      map(portfolios => portfolios.map(p => ({ portfolio: p.portfolio, exchange: p.exchange }))),
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
          value: this.form.value as ArbitrageRobot,
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
