import { Component, DestroyRef, OnInit, output, inject } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  DurationType,
  YieldType
} from "../../models/bond-yield-curve.model";
import {
  filter,
  startWith
} from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TranslocoDirective } from '@jsverse/transloco';
import { NzFormDirective, NzFormItemComponent, NzFormControlComponent } from 'ng-zorro-antd/form';
import { NzRowDirective, NzColDirective } from 'ng-zorro-antd/grid';
import { NzSpaceCompactItemDirective } from 'ng-zorro-antd/space';
import { NzSelectComponent, NzOptionComponent } from 'ng-zorro-antd/select';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';

export interface ChartParameters {
  durationType: DurationType;
  yieldType: YieldType;
}

@Component({
    selector: 'ats-yield-curve-chart-parameters',
    templateUrl: './yield-curve-chart-parameters.component.html',
    styleUrls: ['./yield-curve-chart-parameters.component.less'],
    imports: [TranslocoDirective, FormsModule, NzFormDirective, ReactiveFormsModule, NzRowDirective, NzFormItemComponent, NzColDirective, NzFormControlComponent, NzSpaceCompactItemDirective, NzSelectComponent, NzTooltipDirective, NzOptionComponent]
})
export class YieldCurveChartParametersComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly durationTypes = Object.values(DurationType);
  readonly yieldTypes = Object.values(YieldType);

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

  readonly parametersChanged = output<ChartParameters>();

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
