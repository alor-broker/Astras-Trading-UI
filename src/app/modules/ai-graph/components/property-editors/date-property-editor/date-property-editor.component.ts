import {Component, DestroyRef, OnChanges, SimpleChanges} from '@angular/core';
import {PropertyEditorBaseComponent} from "../property-editor-base";
import {DatePropertyEditorConfig} from "../../../models/property-editor.model";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {filter} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzDatePickerComponent} from "ng-zorro-antd/date-picker";
import {isBefore, isFuture} from "date-fns";

@Component({
    selector: 'ats-date-property-editor',
    imports: [
        NzFormControlComponent,
        NzFormDirective,
        NzFormItemComponent,
        NzFormLabelComponent,
        ReactiveFormsModule,
        TranslocoDirective,
        NzDatePickerComponent
    ],
    templateUrl: './date-property-editor.component.html',
    styleUrl: './date-property-editor.component.less'
})
export class DatePropertyEditorComponent extends PropertyEditorBaseComponent<DatePropertyEditorConfig> implements OnChanges {
  protected readonly form = this.formBuilder.group({
    property: this.formBuilder.control<Date | null>(null)
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

      this.disabledDate = (date: Date): boolean => {
        if (!config.validation.allowFuture) {
          if (isFuture(date)) {
            return true;
          }
        }

        return isBefore(date, config.validation.min);
      };

      this.form.controls.property.setValue(config.initialValue);

      this.form.controls.property.valueChanges.pipe(
        filter(() => this.form.controls.property.valid),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(value => {
        config.applyValueCallback(value);
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected disabledDate = (date: Date): boolean => false;
}
