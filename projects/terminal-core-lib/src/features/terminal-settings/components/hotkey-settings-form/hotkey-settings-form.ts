import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {ControlValueAccessorBase} from '../../../forms/components/control-value-accessor-base';
import {
  ActiveOrderBookHotKeysTypes,
  AllOrderBooksHotKeysTypes,
  HotKeyMeta,
  HotKeysMap,
  HotKeysSettings
} from '../../terminal-settings.types';
import {distinctUntilChanged} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TerminalSettingsHelper} from '../../utils/terminal-settings.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzInputModule} from 'ng-zorro-antd/input';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
import {NzDividerComponent} from 'ng-zorro-antd/divider';
import {HotKeyInput} from '@terminal-core-lib/features/terminal-settings/components/hot-key-input/hot-key-input';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzIconDirective} from 'ng-zorro-antd/icon';

@Component({
  selector: 'ats-hotkey-settings-form',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzTooltipDirective,
    NzSwitchComponent,
    NzDividerComponent,
    HotKeyInput,
    NzTypographyComponent,
    NzIconDirective
  ],
  templateUrl: './hotkey-settings-form.html',
  styleUrl: './hotkey-settings-form.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => HotkeySettingsForm),
    }
  ],
})
export class HotkeySettingsForm extends ControlValueAccessorBase<HotKeysSettings> implements OnInit {
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    allOrderBooksHotKeys: this.formBuilder.nonNullable.array([this.createCommandHotKeyControl('', null)]),
    activeOrderBookHotKeys: this.formBuilder.nonNullable.array([this.createCommandHotKeyControl('', null)]),
    workingVolumes: this.formBuilder.array([this.createWorkingVolumeControl(null)]),
    extraHotKeys: this.formBuilder.nonNullable.control(false)
  });

  private readonly destroyRef = inject(DestroyRef);

  writeValue(value: HotKeysSettings | null): void {
    if (value == null) {
      return;
    }

    this.form.controls.extraHotKeys.setValue(value.extraHotKeys ?? false);

    this.form.controls.workingVolumes.clear();
    for (const workingVolume of value.workingVolumes ?? []) {
      this.form.controls.workingVolumes.push(this.createWorkingVolumeControl(workingVolume));
    }

    const hotKeyControls = [
      ...this.form.controls.allOrderBooksHotKeys.controls,
      ...this.form.controls.activeOrderBookHotKeys.controls
    ];

    for (const hotKeyControl of hotKeyControls) {
      let currentValue = value[hotKeyControl.controls.action.value as keyof HotKeysMap];
      if (currentValue == null) {
        hotKeyControl.controls.hotKey.setValue(null);
        continue;
      }

      if (typeof currentValue === 'string') {
        // need migrate deprecated format
        currentValue = {
          key: currentValue,
          code: '',
          shiftKey: true
        };
      }

      hotKeyControl.controls.hotKey.setValue(currentValue);
    }
  }

  ngOnInit(): void {
    this.fillAvailableHotKeys();

    this.form.valueChanges.pipe(
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.checkIfTouched();
      this.emitValue(
        this.form.valid
          ? this.formValueToSettings()
          : null
      );
    });
  }

  workingVolumeHotkeyChange(e: KeyboardEvent, control: AbstractControl | null): void {
    e.stopPropagation();
    if (e.key === 'Backspace') {
      control?.reset();
    } else {
      control?.setValue(e.key);
    }

    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  addWorkingVolume(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();

    this.form.controls.workingVolumes.push(this.createWorkingVolumeControl(null));
  }

  removeWorkingVolume(e: MouseEvent, index: number): void {
    e.preventDefault();
    e.stopPropagation();

    this.form.controls.workingVolumes.removeAt(index);
  }

  canRemoveWorkingVolume(): boolean {
    return this.form.controls.workingVolumes.length > 1;
  }

  protected needMarkTouched(): boolean {
    return this.form.touched;
  }

  private isKeyUniqueValidator(): ValidatorFn {
    return control => {
      if (!control.value) {
        return null;
      }

      const existedHotKeys = this.getCurrentFormHotKeys();
      if (existedHotKeys.filter(x => JSON.stringify(x) === JSON.stringify(control.value)).length > 1) {
        return {
          notUnique: true
        };
      }

      return null;
    };
  }

  private formValueToSettings(): HotKeysSettings {
    const hotKeyMap: HotKeysMap = {};

    const allHotKeys = [
      ...this.form.value.allOrderBooksHotKeys ?? [],
      ...this.form.value.activeOrderBookHotKeys ?? []
    ];

    for (const hotKey of allHotKeys) {
      hotKeyMap[hotKey.action! as keyof HotKeysMap] = hotKey.hotKey!;
    }

    return {
      ...hotKeyMap,
      workingVolumes: this.form.value.workingVolumes!.map(x => x!),
      extraHotKeys: this.form.value.extraHotKeys ?? false
    };
  }

  private fillAvailableHotKeys(): void {
    const defaultHotKeys = TerminalSettingsHelper.getDefaultHotkeys();

    this.form.controls.allOrderBooksHotKeys.clear();
    for (const hotKeyType of Object.keys(AllOrderBooksHotKeysTypes)) {
      const defaultHotKey = defaultHotKeys[hotKeyType as keyof HotKeysSettings] as (HotKeyMeta | undefined);

      this.form.controls.allOrderBooksHotKeys.push(this.createCommandHotKeyControl(hotKeyType, defaultHotKey ?? null));
    }

    this.form.controls.activeOrderBookHotKeys.clear();
    for (const hotKeyType of Object.keys(ActiveOrderBookHotKeysTypes)) {
      const defaultHotKey = defaultHotKeys[hotKeyType as keyof HotKeysSettings] as (HotKeyMeta | undefined);

      this.form.controls.activeOrderBookHotKeys.push(this.createCommandHotKeyControl(hotKeyType, defaultHotKey ?? null));
    }
  }

  private getCurrentFormHotKeys(): HotKeyMeta[] {
    const formValue = this.form.getRawValue();
    const rawHotKeys = [
      ...(formValue.allOrderBooksHotKeys ?? []).map(x => x.hotKey),
      ...(formValue.activeOrderBookHotKeys ?? []).map(x => x.hotKey),
      ...formValue.workingVolumes
    ];

    return rawHotKeys.filter((x): x is HotKeyMeta => x != null);
  }

  private createWorkingVolumeControl(value: string | null): FormControl<string | null> {
    return this.formBuilder.nonNullable.control(value, [Validators.required, this.isKeyUniqueValidator()]);
  }

  private createCommandHotKeyControl(action: string, hotKey: HotKeyMeta | null): FormGroup<{
    action: FormControl<string>;
    hotKey: FormControl<HotKeyMeta | null>;
  }> {
    return this.formBuilder.nonNullable.group({
      action: this.formBuilder.nonNullable.control(action),
      hotKey: this.formBuilder.control<HotKeyMeta | null>(hotKey, this.isKeyUniqueValidator())
    });
  }
}
