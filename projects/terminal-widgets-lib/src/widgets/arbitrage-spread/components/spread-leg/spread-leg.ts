import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators
} from "@angular/forms";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
import {
  NzFormControlComponent,
  NzFormItemComponent,
  NzFormLabelComponent
} from 'ng-zorro-antd/form';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {ControlValueAccessorBase} from '@terminal-core-lib/features/forms/components/control-value-accessor-base';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {Instrument} from '@terminal-core-lib/common/types/instrument.types';
import {PortfolioKeyEqualityComparer} from '@terminal-core-lib/common/utils/portfolio-key.helper';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {Exchange} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';
import {SpreadLeg as SpreadLegType} from '../../types/arbitrage-spread.types';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';

@Component({
  selector: 'ats-spread-leg',
  templateUrl: './spread-leg.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: SpreadLeg
    },
    {
      provide: NG_VALIDATORS,
      useExisting: SpreadLeg,
      multi: true,
    },
  ],
  imports: [
    TranslocoDirective,
    FormsModule,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    NzFormLabelComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzIconDirective,
    NzTooltipDirective,
    NzEmptyComponent,
    InlineInstrumentSearch,
    InputNumber
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SpreadLeg extends ControlValueAccessorBase<SpreadLegType> implements OnInit, Validator {
  readonly isSideNeeded = input(false);

  readonly portfolios = input<PortfolioKey[]>([]);

  form = new FormGroup({
    instrument: new FormControl<Instrument | null>(null, [
      Validators.required,
    ]),
    quantity: new FormControl(1, [
      Validators.required,
      Validators.min(InputNumberValidation.minPositive),
      Validators.max(InputNumberValidation.max)
    ]),
    ratio: new FormControl(1, [
      Validators.required,
      Validators.min(InputNumberValidation.minPositive),
      Validators.max(InputNumberValidation.max)
    ]),
    portfolio: new FormControl<PortfolioKey | null>(null, Validators.required),
    side: new FormControl(Side.Sell)
  });

  isPortfoliosEqual = PortfolioKeyEqualityComparer.equals;

  sideEnum = Side;

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (!this.isSideNeeded()) {
      this.form.controls.side.disable();
    }

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emitValue(<SpreadLegType>this.form.value));
  }

  getAvailablePortfolios(): PortfolioKey[] {
    const selectedInstrument = this.form.get('instrument')?.value;

    if (!selectedInstrument) {
      return [];
    }

    return this.portfolios().filter(p => p.exchange === selectedInstrument.exchange || (p.exchange === Exchange.United as string));
  }

  instrumentChange(): void {
    this.form.controls.portfolio.reset();
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
    return (this.form.disabled || this.form.valid) ? null : {required: true};
  }

  protected needMarkTouched(): boolean {
    return this.form.touched;
  }
}
