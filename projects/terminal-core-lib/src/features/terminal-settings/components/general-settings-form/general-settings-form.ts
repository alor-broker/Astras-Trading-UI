import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {ControlValueAccessorBase} from '../../../forms/components/control-value-accessor-base';
import {GeneralSettings} from '../terminal-settings-editing.types';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  DesignSettings,
  FontFamilies,
  GridType,
  TableRowHeight,
  TimezoneDisplayOption
} from "../../terminal-settings.types";
import {ThemeType} from '../../../themes/themes.types';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {LANGUAGES_CONFIG} from '../../../translations/translations.provides';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzFormModule} from 'ng-zorro-antd/form';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzCheckboxComponent} from 'ng-zorro-antd/checkbox';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {InputNumber} from '../../../../common/components/input-number/input-number';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzBadgeComponent} from 'ng-zorro-antd/badge';
import {BadgesSettings} from '../badges-settings/badges-settings';

@Component({
  selector: 'ats-general-settings-form',
  imports: [
    TranslocoDirective,
    NzOptionComponent,
    ReactiveFormsModule,
    NzSelectComponent,
    NzCheckboxComponent,
    NzTypographyComponent,
    InputNumber,
    NzPopoverDirective,
    NzIconDirective,
    NzBadgeComponent,
    BadgesSettings,
    NzFormModule
  ],
  templateUrl: './general-settings-form.html',
  styleUrl: './general-settings-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => GeneralSettingsForm),
    }
  ],
})
export class GeneralSettingsForm extends ControlValueAccessorBase<GeneralSettings> implements OnInit {
  readonly excludedSettings = input<string[]>([]);

  timezoneDisplayOption = TimezoneDisplayOption;

  tableRowHeight = TableRowHeight;

  themeTypes = ThemeType;

  gridTypes = GridType;

  readonly availableFontFamilies = Object.values(FontFamilies);

  protected readonly validationSettings = {
    userIdleDurationMin: {
      min: 1,
      max: 1140
    }
  };

  private readonly formBuilder = inject(FormBuilder);

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
        Validators.min(this.validationSettings.userIdleDurationMin.min),
        Validators.max(this.validationSettings.userIdleDurationMin.max)
      ]
    ),
    language: this.formBuilder.nonNullable.control(''),
    badgesBind: this.formBuilder.nonNullable.control(false),
    badgesColors: this.formBuilder.nonNullable.control<string[]>([]),
    tableRowHeight: this.formBuilder.nonNullable.control(TableRowHeight.Medium),
    showCurrentTime: this.formBuilder.nonNullable.control(false),
  });

  private readonly destroyRef = inject(DestroyRef);

  private readonly languagesConfig = inject(LANGUAGES_CONFIG);

  readonly availableLanguages = Object.keys(this.languagesConfig).map(k => {
    const language = (this.languagesConfig as Record<string, { title: string }>)[k];
    return {
      key: k,
      title: language.title,
    };
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
    handler: (key: string, value: T[keyof T], control: AbstractControl) => void
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
