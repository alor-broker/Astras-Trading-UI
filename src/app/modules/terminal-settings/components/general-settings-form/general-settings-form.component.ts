import {
  Component,
  DestroyRef,
  Input,
  OnInit
} from '@angular/core';
import {
  ControlValueAccessorBaseComponent
} from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';
import {
  AbstractControl,
  NG_VALUE_ACCESSOR,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { validationSettings } from '../../utils/validation-settings';
import {
  DesignSettings,
  GridType
} from '../../../../shared/models/terminal-settings/terminal-settings.model';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';
import { ThemeType } from '../../../../shared/models/settings/theme-settings.model';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GeneralSettings } from "../../models/terminal-settings.model";
import { TableRowHeight } from "../../../../shared/models/enums/table-row-height";
import {
  additionalInstrumentsBadges,
  defaultBadgeColor,
  instrumentsBadges
} from "../../../../shared/utils/instruments";
import { CdkDrag, CdkDragEnter, CdkDragStart } from "@angular/cdk/drag-drop";

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

  form?: UntypedFormGroup;

  newBadgeColorControl = new UntypedFormControl(null);
  defaultBadgeColor = defaultBadgeColor;

  draggedBadge: string | null = null;

  constructor(private readonly destroyRef: DestroyRef) {
    super();
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
          theme: new UntypedFormControl(null),
          gridType: new UntypedFormControl(null),
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
        badgesColors: new UntypedFormControl([]),
        tableRowHeight: new UntypedFormControl(TableRowHeight.Medium)
      }
    );

    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      {
        this.checkIfTouched();
        this.emitValue(
          this.form!.valid
            ? this.form!.value as GeneralSettings
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
    group: UntypedFormGroup | null | undefined,
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

  addNewBadgeColor(isPopupVisible: boolean): void {
    if (isPopupVisible) {
      return;
    }

    if (
      this.form == null ||
      (this.newBadgeColorControl.value ?? '').length === 0 ||
      this.form.controls.badgesColors.value.includes(this.newBadgeColorControl.value)) {
      return;
    }

    this.form!.controls.badgesColors.setValue([
      ...(this.form.controls.badgesColors.value as string[]),
      this.newBadgeColorControl.value
    ]);

    this.newBadgeColorControl.reset();
  }

  addPredefinedLabels(): void {
    if (this.form == null) {
      return;
    }

    const badgesColorsFormValue = this.form.controls.badgesColors.value as string[];

    this.form.controls.badgesColors.setValue([
      ...badgesColorsFormValue,
      ...[...instrumentsBadges, ...additionalInstrumentsBadges].filter(b => !badgesColorsFormValue.includes(b)).slice(0, 2)
    ]);
  }

  removeBadgeColor(e: MouseEvent, color: string): void {
    if (this.form == null) {
      return;
    }

    e.stopPropagation();

    this.form!.controls.badgesColors.setValue(
      this.form!.controls.badgesColors.value.filter((b: string) => b !== color)
    );
  }

  changeBadgesOrder(e: CdkDragEnter<string>): void {
    if (this.form == null) {
      return;
    }

    if (this.draggedBadge == null) {
      return;
    }

    const badgesColorsCopy = [...(this.form.controls.badgesColors.value as string[])];
    const sourceIndex = badgesColorsCopy.findIndex(b => b === this.draggedBadge);
    const targetBadge = e.container.data;
    const targetIndex = badgesColorsCopy.findIndex(b => b === targetBadge);

    if (sourceIndex > targetIndex) {
      badgesColorsCopy.splice(sourceIndex, 1);
      badgesColorsCopy.splice(targetIndex, 0, this.draggedBadge);
    } else {
      badgesColorsCopy.splice(targetIndex, 0, this.draggedBadge);
      badgesColorsCopy.splice(sourceIndex, 1);
    }

    this.form.controls.badgesColors.setValue(badgesColorsCopy);
  }

  badgeDragStarts(e: CdkDragStart<CdkDrag>): void {
    this.draggedBadge = e.source.dropContainer.data as string;
  }
}
