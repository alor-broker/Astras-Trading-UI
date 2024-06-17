import {
  Component,
  DestroyRef,
  Input,
  OnInit
} from '@angular/core';
import { ControlValueAccessorBaseComponent } from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  NG_VALUE_ACCESSOR,
  Validators
} from '@angular/forms';
import { validationSettings } from '../../utils/validation-settings';
import {
  DesignSettings,
  FontFamilies,
  GridType
} from '../../../../shared/models/terminal-settings/terminal-settings.model';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';
import { ThemeType } from '../../../../shared/models/settings/theme-settings.model';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GeneralSettings } from "../../models/terminal-settings.model";
import { TableRowHeight } from "../../../../shared/models/enums/table-row-height";

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
export class GeneralSettingsFormComponent extends ControlValueAccessorBaseComponent<GeneralSettings> implements OnInit {
  @Input() excludedSettings: string[] = [];

  readonly validationSettings = validationSettings;

  timezoneDisplayOption = TimezoneDisplayOption;
  tableRowHeight = TableRowHeight;

  themeTypes = ThemeType;

  gridTypes = GridType;
  readonly availableFontFamilies = Object.values(FontFamilies);

  readonly form = this.formBuilder.group({
    designSettings: this.formBuilder.nonNullable.group({
      theme: this.formBuilder.nonNullable.control(ThemeType.dark),
      fontFamily: this.formBuilder.nonNullable.control<FontFamilies | null>(null),
      gridType: this.formBuilder.nonNullable.control(GridType.Fit)
    }),
    timezoneDisplayOption: this.formBuilder.nonNullable.control(TimezoneDisplayOption.MskTime),
    userIdleDurationMin: this.formBuilder.nonNullable.control(
      15,
      [
        Validators.required,
        Validators.min(validationSettings.userIdleDurationMin.min),
        Validators.max(validationSettings.userIdleDurationMin.max)
      ]
    ),
    language: this.formBuilder.nonNullable.control(''),
    badgesBind: this.formBuilder.nonNullable.control(false),
    badgesColors: this.formBuilder.nonNullable.control<string[]>([]),
    tableRowHeight: this.formBuilder.nonNullable.control(TableRowHeight.Medium)
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef
  ) {
    super();
  }

  writeValue(value: GeneralSettings | null): void {
    this.form.reset();

    this.setControlValueInGroup(
      this.form,
      value,
      (key, itemsValue, control) => {
        if (key === 'designSettings') {
          this.setControlValueInGroup(
            control as FormGroup,
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
    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
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

  protected needMarkTouched(): boolean {
    return this.form.touched;
  }

  private setControlValueInGroup<T>(
    group: FormGroup | null | undefined,
    value: T | null,
    handler: (key: string, value: any, control: AbstractControl) => void
  ): void {
    if (!group || !(value ?? null)) {
      return;
    }

    for (const property in value) {
      const control = group.controls[property] as AbstractControl | undefined;

      if (!control) {
        continue;
      }

      handler(property, value![property as keyof T], control);
    }
  }
}
