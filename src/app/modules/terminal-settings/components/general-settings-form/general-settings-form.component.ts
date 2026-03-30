import { Component, DestroyRef, OnInit, input, inject } from '@angular/core';
import {
  ControlValueAccessorBaseComponent
} from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {validationSettings} from '../../utils/validation-settings';
import {
  DesignSettings,
  FontFamilies,
  GridType
} from '../../../../shared/models/terminal-settings/terminal-settings.model';
import {TimezoneDisplayOption} from '../../../../shared/models/enums/timezone-display-option';
import {ThemeType} from '../../../../shared/models/settings/theme-settings.model';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {GeneralSettings} from "../../models/terminal-settings.model";
import {TableRowHeight} from "../../../../shared/models/enums/table-row-height";
import {environment} from "../../../../../environments/environment";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {NzCheckboxComponent} from 'ng-zorro-antd/checkbox';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {InputNumberComponent} from '../../../../shared/components/input-number/input-number.component';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {NzBadgeComponent} from 'ng-zorro-antd/badge';
import {BadgesSettingsComponent} from '../badges-settings/badges-settings.component';

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
  ],
  imports: [
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzCheckboxComponent,
    NzTypographyComponent,
    InputNumberComponent,
    NzIconDirective,
    NzPopoverDirective,
    NzBadgeComponent,
    BadgesSettingsComponent
  ]
})
export class GeneralSettingsFormComponent extends ControlValueAccessorBaseComponent<GeneralSettings> implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly excludedSettings = input<string[]>([]);

  readonly validationSettings = validationSettings;

  timezoneDisplayOption = TimezoneDisplayOption;
  tableRowHeight = TableRowHeight;

  themeTypes = ThemeType;

  gridTypes = GridType;
  readonly availableFontFamilies = Object.values(FontFamilies);
  readonly availableLanguages = Object.keys(environment.internationalization).map(k => {
    const language = (environment.internationalization as unknown as any)[k] as { title: string };
    return {
      key: k,
      title: language.title,
    };
  });

  readonly form = this.formBuilder.group({
    designSettings: this.formBuilder.nonNullable.group({
      theme: this.formBuilder.nonNullable.control(ThemeType.dark),
      fontFamily: this.formBuilder.nonNullable.control<FontFamilies | null>(null),
      gridType: this.formBuilder.nonNullable.control(GridType.Fit)
    }),
    timezoneDisplayOption: this.formBuilder.nonNullable.control(TimezoneDisplayOption.MskTime),
    isLogoutOnUserIdle: this.formBuilder.nonNullable.control(false),
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
    tableRowHeight: this.formBuilder.nonNullable.control(TableRowHeight.Medium),
    showCurrentTime: this.formBuilder.nonNullable.control(false),
  });

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
