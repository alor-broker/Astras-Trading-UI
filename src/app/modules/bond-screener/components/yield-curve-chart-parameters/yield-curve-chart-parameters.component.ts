import {
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output
} from '@angular/core';
import {
  FormBuilder,
  Validators
} from "@angular/forms";
import {
  DurationType,
  YieldType
} from "../../models/bond-yield-curve.model";
import {
  filter,
  startWith
} from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

export interface ChartParameters {
  durationType: DurationType;
  yieldType: YieldType;
}

@Component({
    selector: 'ats-yield-curve-chart-parameters',
    templateUrl: './yield-curve-chart-parameters.component.html',
    styleUrls: ['./yield-curve-chart-parameters.component.less'],
    standalone: false
})
export class YieldCurveChartParametersComponent implements OnInit {
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

  @Output()
  parametersChanged = new EventEmitter<ChartParameters>();

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef
  ) {
  }

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
