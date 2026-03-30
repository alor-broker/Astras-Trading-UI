import { Component, DestroyRef, OnChanges, SimpleChanges, inject } from '@angular/core';
import {PropertyEditorBaseComponent} from "../property-editor-base";
import {SelectPropertyEditorConfig} from "../../../models/property-editor.model";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {filter} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzOptionComponent, NzSelectComponent} from "ng-zorro-antd/select";

@Component({
    selector: 'ats-select-property-editor',
    imports: [
        NzFormControlComponent,
        NzFormDirective,
        NzFormItemComponent,
        NzFormLabelComponent,
        ReactiveFormsModule,
        TranslocoDirective,
        NzSelectComponent,
        NzOptionComponent
    ],
    templateUrl: './select-property-editor.component.html',
    styleUrl: './select-property-editor.component.less'
})
export class SelectPropertyEditorComponent extends PropertyEditorBaseComponent<SelectPropertyEditorConfig> implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.formBuilder.group({
    property: this.formBuilder.control<string | null>(null)
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.config.currentValue != null || changes.config.firstChange) {
      const config = this.getTypedConfig();

      if (config.validation.required) {
        this.form.controls.property.addValidators([
          Validators.required
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
