import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {
  filter,
  startWith
} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent
} from 'ng-zorro-antd/form';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {
  DurationType,
  YieldType
} from '@terminal-widgets-lib/widgets/bond-screener/types/bond-yield-curve.types';

export interface ChartParameters {
  durationType: DurationType;
  yieldType: YieldType;
}

@Component({
  selector: 'ats-yield-curve-chart-parameters',
  templateUrl: './yield-curve-chart-parameters.html',
  styleUrls: ['./yield-curve-chart-parameters.less'],
  imports: [
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    NzSelectComponent,
    NzTooltipDirective,
    NzOptionComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class YieldCurveChartParameters implements OnInit {
  readonly durationTypes = Object.values(DurationType);

  readonly yieldTypes = Object.values(YieldType);

  readonly parametersChanged = output<ChartParameters>();

  private readonly formBuilder = inject(FormBuilder);

  parametersForm = this.formBuilder.group({
    durationType: this.formBuilder.nonNullable.control(
      DurationType.MaturityDateBased,
      Validators.required
    ),
    yieldType: this.formBuilder.nonNullable.control(
      YieldType.CurrentYield,
      Validators.required
    )
  });

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.parametersForm.valueChanges.pipe(
      startWith(this.parametersForm.value),
      filter(() => this.parametersForm.valid),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(r => {
      this.parametersChanged.emit({
        durationType: r.durationType!,
        yieldType: r.yieldType!
      });
    });
  }
}
