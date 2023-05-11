import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { ArbitrationExtension } from "../../models/arbitration-extension.model";

@Component({
  selector: 'ats-arbitration-extension-manage',
  templateUrl: './arbitration-extension-manage.component.html',
  styleUrls: ['./arbitration-extension-manage.component.less']
})
export class ArbitrationExtensionManageComponent implements OnInit {
  @Input() extension?: ArbitrationExtension | null;
  @Output() formChange = new EventEmitter();

  form = new UntypedFormGroup({
    id: new UntypedFormControl(null),
    firstLeg: new UntypedFormGroup({
      instrument: new UntypedFormControl(null, Validators.required),
      quantity: new UntypedFormControl(null, Validators.required),
      ratio: new UntypedFormControl(1)
    }),
    secondLeg: new UntypedFormGroup({
      instrument: new UntypedFormControl(null, Validators.required),
      quantity: new UntypedFormControl(null, Validators.required),
      ratio: new UntypedFormControl(1)
    }),
  });

  get firstLegFormGroup(): UntypedFormGroup {
    return this.form.get('firstLeg') as UntypedFormGroup;
  }

  get secondLegFormGroup(): UntypedFormGroup {
    return this.form.get('secondLeg') as UntypedFormGroup;
  }

  ngOnInit() {
    if (this.extension) {
      this.form.get('firstLeg')?.setValue(this.extension.firstLeg);
      this.form.get('secondLeg')?.setValue(this.extension.secondLeg);
      this.form.get('id')?.setValue(this.extension.id);
    }

    this.form.valueChanges.subscribe(value => {
      this.formChange.emit({
        value,
        isValid: this.form.valid
      });
    });
  }
}
