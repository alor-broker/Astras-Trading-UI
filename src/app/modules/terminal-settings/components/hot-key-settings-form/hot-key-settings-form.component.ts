import {
  Component, DestroyRef,
  OnInit
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  NG_VALUE_ACCESSOR,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { HotKeyMeta, HotKeysSettings } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import {
  distinctUntilChanged
} from 'rxjs';
import { ControlValueAccessorBaseComponent } from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';
import { TerminalSettingsHelper } from "../../../../shared/utils/terminal-settings-helper";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

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
export class HotKeySettingsFormComponent extends ControlValueAccessorBaseComponent<HotKeysSettings> implements OnInit {
  form?: UntypedFormGroup;

  constructor(private readonly destroyRef: DestroyRef) {
    super();
  }

  get workingVolumes(): UntypedFormArray {
    return this.form!.get('workingVolumes') as UntypedFormArray;
  }

  writeValue(value: HotKeysSettings | null): void {
    if (!this.form || !value) {
      return;
    }

    for (const property in value) {
      const control = this.form.controls[property] as AbstractControl | undefined;

      if (!control) {
        continue;
      }

      if (property === 'workingVolumes') {
        const workingVolumesControl = control as FormArray;
        workingVolumesControl.clear();

        const values = value[property] as string[] | undefined ?? [];
        values.forEach(x => workingVolumesControl.push(this.createWorkingVolumeControl(x)));

        continue;
      }

      control.setValue(value[property as keyof HotKeysSettings]);
    }
  }

  ngOnInit(): void {
    this.form = new UntypedFormGroup({
      cancelOrdersAll: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      cancelOrdersAndClosePositionsByMarketAll: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      cancelOrdersKey: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      closePositionsKey: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      centerOrderbookKey: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      cancelOrderbookOrders: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      cancelStopOrdersCurrent: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      closeOrderbookPositions: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      reverseOrderbookPositions: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      buyMarket: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      sellMarket: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      sellBestOrder: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      buyBestOrder: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      buyBestAsk: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      sellBestBid: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      increaseScale: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      decreaseScale: new UntypedFormControl(null, this.isKeyUniqueValidator()),
      workingVolumes: new UntypedFormArray([]),
      extraHotKeys: new UntypedFormControl(false)
    });

    this.form!.get('extraHotKeys')!.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        const defaultHotKeys: HotKeysSettings = TerminalSettingsHelper.getDefaultHotkeys();

        Object.entries(this.form!.controls).forEach(([key, control]) => {
          if (typeof control.value === 'string') {
            control.setValue(defaultHotKeys[<keyof HotKeysSettings>key]);
          }
        });
      });

    this.form.valueChanges.pipe(
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.checkIfTouched();
      this.emitValue(
        this.form!.valid
          ? this.form!.value as HotKeysSettings
          : null
      );
    });
  }

  hotkeyChange(e: KeyboardEvent, control: AbstractControl | null): void {
    e.stopPropagation();
    if (e.key === 'Backspace') {
      control?.reset();
    }
    else {
      control?.setValue(e.key);
    }

    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  addWorkingVolume(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();

    this.workingVolumes.push(this.createWorkingVolumeControl(null));
  }

  removeWorkingVolume(e: MouseEvent, index: number): void {
    e.preventDefault();
    e.stopPropagation();

    this.workingVolumes.removeAt(index);
  }

  canRemoveWorkingVolume(): boolean {
    return this.workingVolumes.length > 1;
  }

  isKeyUniqueValidator(): ValidatorFn {
    return control => {
      if (!control.value) {
        return null;
      }

      const existedKeys = this.getAllKeys(this.form!.getRawValue());
      if (existedKeys.filter(x => JSON.stringify(x) === JSON.stringify(control.value)).length > 1) {
        return {
          notUnique: true
        };
      }

      return null;
    };
  }

  asFormControl(control: AbstractControl): UntypedFormControl {
    return control as UntypedFormControl;
  }

  protected needMarkTouched(): boolean {
    if (!this.form) {
      return false;
    }

    return this.form.touched;
  }

  private getAllKeys(formValue: { [keyName: string]: HotKeyMeta | string | string[] | null }): (string | HotKeyMeta)[] {
    const keys: (string | HotKeyMeta)[] = [];
    for (const property in formValue) {
      const value = formValue[property];
      if (value == null) {
        continue;
      }

      if (Array.isArray(value)) {
        keys.push(...(value as []));
      }
      else {
        keys.push(value);
      }
    }

    return keys;
  }

  private createWorkingVolumeControl(value: string | null): UntypedFormControl {
    return new UntypedFormControl(value, [Validators.required, this.isKeyUniqueValidator()]);
  }
}
