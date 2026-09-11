import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
} from "@angular/core";
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {Observable} from "rxjs";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzInputDirective} from "ng-zorro-antd/input";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzInputNumberComponent} from "ng-zorro-antd/input-number";
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';
import {InstrumentBoardSelect} from '@terminal-core-lib/features/instruments/components/instrument-board-select/instrument-board-select';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {OrderSubmitWidgetSettings} from '@terminal-widgets-lib/widgets/order-commands/widget-settings.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {
  InstrumentEqualityComparer,
  InstrumentKeyHelper
} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';
import {WidgetSettingsSwitch} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-switch/widget-settings-switch';
import {SettingsDeviceVisibility} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-visibility.types';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';

@Component({
  selector: 'ats-order-submit-settings',
  templateUrl: './order-submit-settings.html',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    NzInputDirective,
    NzTypographyComponent,
    NzButtonComponent,
    NzIconDirective,
    NzInputNumberComponent,
    InlineInstrumentSearch,
    InstrumentBoardSelect,
    WidgetSettingsEditor,
    WidgetSettingsGroup,
    WidgetSettingsForm,
    WidgetSettingsFormItem,
    WidgetSettingsSwitch
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OrderSubmitSettings extends WidgetSettingsBase<OrderSubmitWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly DeviceVisibility = SettingsDeviceVisibility;

  readonly validationOptions = {
    limitOrderPriceMoveStep: {
      min: 1,
      max: 200
    },
    workingVolume: {
      min: 1,
      max: InputNumberValidation.max
    }
  };

  protected settings$!: Observable<OrderSubmitWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.group({
      instrumentKey: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
      instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null)
    }),
    fastEditing: this.formBuilder.group({
      enableLimitOrdersFastEditing: this.formBuilder.nonNullable.control(false),
      limitOrderPriceMoveSteps: this.formBuilder.array<FormControl<number | null>>([]),
      skipMarginOrderConfirmation: this.formBuilder.nonNullable.control(false)
    }),
    volumes: this.formBuilder.group({
      showVolumePanel: this.formBuilder.nonNullable.control(false),
      workingVolumes: this.formBuilder.array<FormControl<number | null>>([])
    })
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form.controls.instrument.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  removeLimitOrderPriceMoveStep($event: MouseEvent, index: number): void {
    $event.preventDefault();
    $event.stopPropagation();

    this.form.controls.fastEditing.controls.limitOrderPriceMoveSteps.removeAt(index);
  }

  addLimitOrderPriceMoveStep($event: MouseEvent): void {
    $event.preventDefault();
    $event.stopPropagation();

    const stepsControl = this.form.controls.fastEditing.controls.limitOrderPriceMoveSteps;
    const defaultValue = stepsControl.controls[stepsControl.length - 1]?.value ?? this.validationOptions.limitOrderPriceMoveStep.min;
    stepsControl.push(this.createLimitOrderPriceMoveStepControl(defaultValue));
  }

  removeWorkingVolume($event: MouseEvent, index: number): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.form.controls.volumes.controls.workingVolumes.removeAt(index);
  }

  addWorkingVolume($event: MouseEvent): void {
    $event.preventDefault();
    $event.stopPropagation();

    const workingVolumeControl = this.form.controls.volumes.controls.workingVolumes;
    const defaultValue = workingVolumeControl.controls[workingVolumeControl.length - 1]?.value;
    workingVolumeControl.push(this.createWorkingVolumeControl(defaultValue ?? 1));
  }

  protected getUpdatedSettings(initialSettings: OrderSubmitWidgetSettings): Partial<OrderSubmitWidgetSettings> {
    const {instrument, fastEditing, volumes} = this.form.getRawValue();
    const newSettings = {
      symbol: instrument.instrumentKey?.symbol ?? '',
      exchange: instrument.instrumentKey?.exchange ?? '',
      isin: instrument.instrumentKey?.isin,
      instrumentGroup: instrument.instrumentGroup,
      defaultOrderType: initialSettings.defaultOrderType,
      enableLimitOrdersFastEditing: fastEditing.enableLimitOrdersFastEditing,
      skipMarginOrderConfirmation: fastEditing.enableLimitOrdersFastEditing && fastEditing.skipMarginOrderConfirmation,
      limitOrderPriceMoveSteps: fastEditing.limitOrderPriceMoveSteps.map(value => Number(value)),
      showVolumePanel: volumes.showVolumePanel,
      workingVolumes: volumes.workingVolumes.map(value => Number(value)),
      linkToActive: false
    };

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && InstrumentEqualityComparer.equals(initialSettings, newSettings);
    return newSettings;
  }

  protected setCurrentFormValues(settings: OrderSubmitWidgetSettings): void {
    this.form.controls.fastEditing.controls.limitOrderPriceMoveSteps.clear();
    this.form.controls.volumes.controls.workingVolumes.clear();
    this.form.reset();

    this.form.controls.instrument.controls.instrumentKey.setValue(InstrumentKeyHelper.toInstrumentKey(settings));
    this.form.controls.instrument.controls.instrumentGroup.setValue(settings.instrumentGroup ?? null);

    this.form.controls.fastEditing.controls.enableLimitOrdersFastEditing.setValue(settings.enableLimitOrdersFastEditing ?? false);
    this.form.controls.fastEditing.controls.skipMarginOrderConfirmation.setValue(settings.skipMarginOrderConfirmation ?? false);
    const sortedSteps = [...(settings.limitOrderPriceMoveSteps ?? [1, 2, 5, 10])].sort((a, b) => a - b);
    for (const step of sortedSteps) {
      this.form.controls.fastEditing.controls.limitOrderPriceMoveSteps.push(this.createLimitOrderPriceMoveStepControl(step));
    }

    this.form.controls.volumes.controls.showVolumePanel.setValue(settings.showVolumePanel ?? false);
    const sortedVolumes = [...(settings.workingVolumes ?? [1, 5, 10, 20, 30, 40, 50, 100, 200])].sort((a, b) => a - b);
    for (const step of sortedVolumes) {
      this.form.controls.volumes.controls.workingVolumes.push(this.createWorkingVolumeControl(step));
    }
  }

  private createLimitOrderPriceMoveStepControl(defaultValue: number): FormControl<number | null> {
    return this.formBuilder.nonNullable.control(
      defaultValue,
      [
        Validators.required,
        Validators.min(this.validationOptions.limitOrderPriceMoveStep.min),
        Validators.max(this.validationOptions.limitOrderPriceMoveStep.max)
      ]
    );
  }

  private createWorkingVolumeControl(defaultValue: number): FormControl<number | null> {
    return this.formBuilder.nonNullable.control(
      defaultValue,
      [
        Validators.required,
        Validators.min(this.validationOptions.workingVolume.min),
        Validators.max(this.validationOptions.workingVolume.max)
      ]
    );
  }
}
