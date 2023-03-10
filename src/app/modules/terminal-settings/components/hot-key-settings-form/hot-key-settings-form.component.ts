import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  NG_VALUE_ACCESSOR,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { HotKeysSettings } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import { Destroyable } from '../../../../shared/utils/destroyable';
import {
  distinctUntilChanged,
  takeUntil
} from 'rxjs';
import { ControlValueAccessorBaseComponent } from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';

@Component({
  selector: 'ats-hot-key-settings-form',
  templateUrl: './hot-key-settings-form.component.html',
  styleUrls: ['./hot-key-settings-form.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: HotKeySettingsFormComponent
    }
  ]
})
export class HotKeySettingsFormComponent extends ControlValueAccessorBaseComponent<HotKeysSettings> implements OnInit, OnDestroy {
  form!: UntypedFormGroup;
  private destroyable = new Destroyable();

  constructor() {
    super();
  }

  get workingVolumes(): UntypedFormArray {
    return this.form?.get('workingVolumes') as UntypedFormArray;
  }

  ngOnDestroy(): void {
    this.destroyable.destroy();
  }

  writeValue(value: HotKeysSettings | null): void {
    if (!this.form || !value) {
      return;
    }

    for (const property in value) {
      const control = this.form.controls[property];

      if (!control) {
        continue;
      }

      if (property === 'workingVolumes') {
        const workingVolumesControl = control as FormArray;
        workingVolumesControl.clear();

        const values = value[property] as string[] ?? [];
        values.forEach(x => workingVolumesControl.push(new UntypedFormControl(x, Validators.required)));

        continue;
      }

      control.setValue(value[property as keyof HotKeysSettings]);
    }
  }

  ngOnInit(): void {
    this.form = new UntypedFormGroup({
      cancelOrdersKey: new UntypedFormControl(null),
      closePositionsKey: new UntypedFormControl(null),
      centerOrderbookKey: new UntypedFormControl(null),
      cancelOrderbookOrders: new UntypedFormControl(null),
      closeOrderbookPositions: new UntypedFormControl(null),
      reverseOrderbookPositions: new UntypedFormControl(null),
      buyMarket: new UntypedFormControl(null),
      sellMarket: new UntypedFormControl(null),
      sellBestOrder: new UntypedFormControl(null),
      buyBestOrder: new UntypedFormControl(null),
      buyBestAsk: new UntypedFormControl(null),
      sellBestBid: new UntypedFormControl(null),
      workingVolumes: new UntypedFormArray([]),
    });

    this.form.valueChanges.pipe(
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(() => {
      this.checkIfTouched();
      this.emitValue(
        this.form.valid
          ? this.form.value as HotKeysSettings
          : null
      );
    });
  }

  hotkeyChange(e: KeyboardEvent, control: AbstractControl | null) {
    e.stopPropagation();
    if (e.key === 'Backspace') {
      control?.reset();
    }
    else {
      control?.setValue(e.key);
    }
  }

  addWorkingVolume(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.workingVolumes.push(new UntypedFormControl(null, Validators.required));
  }

  removeWorkingVolume(e: MouseEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();

    this.workingVolumes.removeAt(index);
  }

  canRemoveWorkingVolume(): boolean {
    return this.workingVolumes.length > 1;
  }

  protected needMarkTouched(): boolean {
    if (!this.form) {
      return false;
    }

    return this.form.touched;
  }
}
