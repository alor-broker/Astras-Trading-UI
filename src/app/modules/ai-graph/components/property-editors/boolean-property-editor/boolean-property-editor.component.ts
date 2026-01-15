import { Component, DestroyRef, OnChanges, SimpleChanges, inject } from '@angular/core';
import {PropertyEditorBaseComponent} from "../property-editor-base";
import {BooleanPropertyEditorConfig} from "../../../models/property-editor.model";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {filter} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzSwitchComponent} from "ng-zorro-antd/switch";

@Component({
    selector: 'ats-boolean-property-editor',
    imports: [
        NzFormControlComponent,
        NzFormDirective,
        NzFormItemComponent,
        NzFormLabelComponent,
        ReactiveFormsModule,
        TranslocoDirective,
        NzSwitchComponent
    ],
    templateUrl: './boolean-property-editor.component.html',
    styleUrl: './boolean-property-editor.component.less'
})
export class BooleanPropertyEditorComponent extends PropertyEditorBaseComponent<BooleanPropertyEditorConfig> implements OnChanges {
  protected readonly formBuilder = inject(FormBuilder);
  protected readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.formBuilder.group({
    property: this.formBuilder.control<boolean>(false)
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.config.currentValue != null || changes.config.firstChange) {
      const config = this.getTypedConfig();
      this.form.controls.property.setValue(config.initialValue ?? false);

      this.form.controls.property.valueChanges.pipe(
        filter(() => this.form.controls.property.valid),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(value => {
        config.applyValueCallback(value);
      });
    }
  }
}
