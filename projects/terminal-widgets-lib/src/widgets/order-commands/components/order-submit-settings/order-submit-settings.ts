import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {
  Observable,
  take
} from "rxjs";
import {TranslocoDirective} from "@jsverse/transloco";
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent
} from "ng-zorro-antd/form";
import {
  NzColDirective,
  NzRowDirective
} from "ng-zorro-antd/grid";
import {NzInputDirective} from "ng-zorro-antd/input";
import {NzSwitchComponent} from "ng-zorro-antd/switch";
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from "ng-zorro-antd/collapse";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {AsyncPipe} from "@angular/common";
import {NzInputNumberComponent} from "ng-zorro-antd/input-number";
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';
import {InstrumentBoardSelect} from '@terminal-core-lib/features/instruments/components/instrument-board-select/instrument-board-select';
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {OrderSubmitWidgetSettings} from '@terminal-widgets-lib/widgets/order-commands/widget-settings.types';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {DeviceInfo} from '@terminal-core-lib/common/services/device-service-types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {InstrumentEqualityComparer} from '@terminal-core-lib/common/utils/instrument-key.helper';

@Component({
  selector: 'ats-order-submit-settings',
  templateUrl: './order-submit-settings.html',
  styleUrls: ['./order-submit-settings.less'],
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
    NzInputDirective,
    NzSwitchComponent,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    NzTypographyComponent,
    NzButtonComponent,
    NzIconDirective,
    AsyncPipe,
    NzInputNumberComponent,
    InlineInstrumentSearch,
    InstrumentBoardSelect,
    WidgetSettings
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OrderSubmitSettings extends WidgetSettingsBase<OrderSubmitWidgetSettings> implements OnInit {
  deviceInfo$!: Observable<DeviceInfo>;

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

  private readonly deviceService = inject(DeviceService);

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
    instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
    enableLimitOrdersFastEditing: this.formBuilder.nonNullable.control(false),
    limitOrderPriceMoveSteps: this.formBuilder.nonNullable.array([]),
    skipMarginOrderConfirmation: this.formBuilder.nonNullable.control(false),
    showVolumePanel: this.formBuilder.nonNullable.control(false),
    workingVolumes: this.formBuilder.nonNullable.array([]),
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.deviceInfo$ = this.deviceService.deviceInfo$
      .pipe(
        take(1)
      );
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  removeLimitOrderPriceMoveStep($event: MouseEvent, index: number): void {
    $event.preventDefault();
    $event.stopPropagation();

    this.form.controls.limitOrderPriceMoveSteps.removeAt(index);
  }

  addLimitOrderPriceMoveStep($event: MouseEvent): void {
    $event.preventDefault();
    $event.stopPropagation();

    const stepsControl = this.form.controls.limitOrderPriceMoveSteps;
    const defaultValue = stepsControl.controls[stepsControl.length - 1].value as number;
    stepsControl.push(this.createLimitOrderPriceMoveStepControl(defaultValue));
  }

  removeWorkingVolume($event: MouseEvent, index: number): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.form.controls.workingVolumes.removeAt(index);
  }

  addWorkingVolume($event: MouseEvent): void {
    $event.preventDefault();
    $event.stopPropagation();

    const workingVolumeControl = this.form.controls.workingVolumes;
    const defaultValue = workingVolumeControl.controls[workingVolumeControl.length - 1]?.value as number | undefined;
    workingVolumeControl.push(this.createWorkingVolumeControl(defaultValue ?? 1));
  }

  protected getUpdatedSettings(initialSettings: OrderSubmitWidgetSettings): Partial<OrderSubmitWidgetSettings> {
    const formValue = this.form.value as Partial<OrderSubmitWidgetSettings & {
      instrument: InstrumentKey;
      workingVolumes: number[];
      limitOrderPriceMoveSteps: number[];
    }>;

    const newSettings = {
      ...formValue,
      defaultOrderType: initialSettings.defaultOrderType,
      symbol: formValue.instrument?.symbol ?? '',
      exchange: formValue.instrument?.exchange ?? '',
      skipMarginOrderConfirmation: (formValue.enableLimitOrdersFastEditing ?? false) && (formValue.skipMarginOrderConfirmation ?? false),
      limitOrderPriceMoveSteps: formValue.limitOrderPriceMoveSteps?.map((x: number) => Number(x)),
      workingVolumes: formValue.workingVolumes?.map((x: number) => Number(x)),
    };

    delete newSettings.instrument;
    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && InstrumentEqualityComparer.equals(initialSettings, newSettings);

    return newSettings as Partial<OrderSubmitWidgetSettings>;
  }

  protected setCurrentFormValues(settings: OrderSubmitWidgetSettings): void {
    this.form.reset();

    this.form.controls.instrument.setValue({
      symbol: settings.symbol,
      exchange: settings.exchange,
      instrumentGroup: settings.instrumentGroup ?? null
    });
    this.form.controls.instrumentGroup.setValue(settings.instrumentGroup ?? null);

    this.form.controls.enableLimitOrdersFastEditing.setValue(settings.enableLimitOrdersFastEditing ?? false);
    this.form.controls.skipMarginOrderConfirmation.setValue(settings.skipMarginOrderConfirmation ?? false);
    const sortedSteps = [...settings.limitOrderPriceMoveSteps].sort((a, b) => a - b);
    for (const step of sortedSteps) {
      this.form.controls.limitOrderPriceMoveSteps.push(this.createLimitOrderPriceMoveStepControl(step));
    }

    this.form.controls.showVolumePanel.setValue(settings.showVolumePanel ?? false);
    const sortedVolumes = [...settings.workingVolumes].sort((a, b) => a - b);
    for (const step of sortedVolumes) {
      this.form.controls.workingVolumes.push(this.createWorkingVolumeControl(step));
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
