import {Component, DestroyRef, OnChanges, SimpleChanges} from '@angular/core';
import {PropertyEditorBaseComponent} from "../property-editor-base";
import {NumberPropertyEditorConfig} from "../../../models/property-editor.model";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {TranslocoDirective} from "@jsverse/transloco";
import {filter} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {InputNumberComponent} from "../../../../../shared/components/input-number/input-number.component";

@Component({
  selector: 'ats-number-property-editor',
  standalone: true,
  imports: [
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    ReactiveFormsModule,
    TranslocoDirective,
    InputNumberComponent
  ],
  templateUrl: './number-property-editor.component.html',
  styleUrl: './number-property-editor.component.less'
})
export class NumberPropertyEditorComponent extends PropertyEditorBaseComponent<NumberPropertyEditorConfig> implements OnChanges {
  protected readonly form = this.formBuilder.group({
    property: this.formBuilder.control<number | null>(null)
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.config.currentValue != null || changes.config.firstChange) {
      const config = this.getTypedConfig();

      if (config.validation.required) {
        this.form.controls.property.addValidators([
          Validators.required
        ]);
      }

      if (config.validation.min != null) {
        this.form.controls.property.addValidators([
          Validators.min(config.validation.min)
        ]);
      }

      if (config.validation.max != null) {
        this.form.controls.property.addValidators([
          Validators.max(config.validation.max)
        ]);
      }

      this.form.controls.property.setValue(config.initialValue);

      this.form.controls.property.valueChanges.pipe(
        filter(() => this.form.controls.property.valid),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(value => {
        config.applyValueCallback(value);
      });
    }
  }
}
