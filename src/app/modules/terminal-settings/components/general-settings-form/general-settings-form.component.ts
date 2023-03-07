import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ControlValueAccessorBaseComponent } from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';
import { GeneralSettings } from '../../models/terminal-settings.model';
import {
  AbstractControl,
  NG_VALUE_ACCESSOR,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { validationSettings } from '../../utils/validation-settings';
import { DesignSettings } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import { Destroyable } from '../../../../shared/utils/destroyable';
import { takeUntil } from 'rxjs';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';
import { ThemeType } from '../../../../shared/models/settings/theme-settings.model';

@Component({
  selector: 'ats-general-settings-form',
  templateUrl: './general-settings-form.component.html',
  styleUrls: ['./general-settings-form.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: GeneralSettingsFormComponent
    }
  ]
})
export class GeneralSettingsFormComponent extends ControlValueAccessorBaseComponent<GeneralSettings> implements OnInit, OnDestroy {
  readonly validationSettings = validationSettings;

  timezoneDisplayOption = TimezoneDisplayOption;

  themeTypes = ThemeType;

  form!: UntypedFormGroup;
  private readonly destroyable = new Destroyable();

  constructor() {
    super();
  }

  ngOnDestroy(): void {
    this.destroyable.destroy();
  }

  writeValue(value: GeneralSettings | null): void {
    this.setControlValueInGroup(
      this.form,
      value,
      (key, itemsValue, control) => {
        if (key === 'designSettings') {
          this.setControlValueInGroup(
            control as UntypedFormGroup,
            itemsValue as DesignSettings,
            (k, v, c) => {
              c.setValue(v);
            }
          );

          return;
        }

        control.setValue(itemsValue);
      }
    );
  }

  ngOnInit(): void {
    this.form = new UntypedFormGroup(
      {
        designSettings: new UntypedFormGroup({
          theme: new UntypedFormControl(null)
        }),
        timezoneDisplayOption: new UntypedFormControl(null, Validators.required),
        userIdleDurationMin: new UntypedFormControl(
          null,
          [
            Validators.required,
            Validators.min(validationSettings.userIdleDurationMin.min),
            Validators.max(validationSettings.userIdleDurationMin.max)
          ]),
        language: new UntypedFormControl(''),
        badgesBind: new UntypedFormControl(null),
      }
    );

    this.form.valueChanges.pipe(
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(() => {
      {
        this.checkIfTouched();
        this.emitValue(
          this.form.valid
            ? this.form.value as GeneralSettings
            : null
        );
      }
    });
  }

  asFormGroup(ctrl: AbstractControl): UntypedFormGroup {
    return ctrl as UntypedFormGroup;
  }

  protected needMarkTouched(): boolean {
    if (!this.form) {
      return false;
    }

    return this.form.touched;
  }

  private setControlValueInGroup<T>(
    group: UntypedFormGroup,
    value: T | null,
    handler: (key: string, value: any, control: AbstractControl) => void
  ) {
    if (!group || !value) {
      return;
    }

    for (const property in value) {
      const control = group.controls[property];

      if (!control) {
        continue;
      }

      handler(property, value[property as keyof T], control);
    }
  }

}
