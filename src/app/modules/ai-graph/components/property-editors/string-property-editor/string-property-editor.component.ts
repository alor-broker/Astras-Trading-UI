import {Component, DestroyRef, OnChanges, SimpleChanges} from '@angular/core';
import {StringPropertyEditorConfig} from "../../../models/property-editor.model";
import {PropertyEditorBaseComponent} from "../property-editor-base";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {filter} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzInputDirective} from "ng-zorro-antd/input";

@Component({
  selector: 'ats-string-property-editor',
  standalone: true,
  imports: [
    NzFormDirective,
    TranslocoDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzInputDirective,
    NzFormControlComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './string-property-editor.component.html',
  styleUrl: './string-property-editor.component.less'
})
export class StringPropertyEditorComponent extends PropertyEditorBaseComponent<StringPropertyEditorConfig> implements OnChanges {
  protected readonly form = this.formBuilder.group({
    property: this.formBuilder.control<string | null>(null)
  });

  constructor(
    protected readonly formBuilder: FormBuilder,
    protected readonly destroyRef: DestroyRef,
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.config.currentValue != null || changes.config.firstChange) {
      const config = this.getTypedConfig();

      if (config.validation.minLength > 0) {
        this.form.controls.property.addValidators([
          Validators.required
        ]);
      }

      this.form.controls.property.addValidators([
        Validators.minLength(config.validation.minLength),
        Validators.maxLength(config.validation.maxLength)
      ]);

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
