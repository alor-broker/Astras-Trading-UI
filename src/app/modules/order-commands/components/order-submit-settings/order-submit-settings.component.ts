import {
  Component,
  DestroyRef,
  OnInit
} from "@angular/core";
import {
  FormBuilder,
  FormControl,
  Validators
} from "@angular/forms";
import {
  Observable,
  take
} from "rxjs";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { OrderSubmitSettings } from "../../models/order-submit-settings.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { DeviceService } from "../../../../shared/services/device.service";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { isInstrumentEqual } from "../../../../shared/utils/settings-helper";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";

@Component({
  selector: 'ats-order-submit-settings',
  templateUrl: './order-submit-settings.component.html',
  styleUrls: ['./order-submit-settings.component.less']
})
export class OrderSubmitSettingsComponent extends WidgetSettingsBaseComponent<OrderSubmitSettings> implements OnInit {
  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
    instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
    enableLimitOrdersFastEditing: this.formBuilder.nonNullable.control(false),
    limitOrderPriceMoveSteps: this.formBuilder.nonNullable.array([]),
    showVolumePanel: this.formBuilder.nonNullable.control(false),
    workingVolumes: this.formBuilder.nonNullable.array([]),
  });

  deviceInfo$!: Observable<any>;

  readonly validationOptions = {
    limitOrderPriceMoveStep: {
      min: 1,
      max: 200
    },
    workingVolume: {
      min: 1,
      max: inputNumberValidation.max
    }
  };

  protected settings$!: Observable<OrderSubmitSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    protected readonly destroyRef: DestroyRef,
    private readonly deviceService: DeviceService,
    private readonly formBuilder: FormBuilder,
  ) {
    super(settingsService, manageDashboardsService, destroyRef);
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form.valid;
  }

  ngOnInit(): void {
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

  protected getUpdatedSettings(initialSettings: OrderSubmitSettings): Partial<OrderSubmitSettings> {
    const formValue = this.form.value as Partial<OrderSubmitSettings & {
      instrument: InstrumentKey;
      workingVolumes: number[];
      limitOrderPriceMoveSteps: number[];
    }>;

    const newSettings = {
      ...formValue,
      symbol: formValue.instrument?.symbol!,
      exchange: formValue.instrument?.exchange!,
      limitOrderPriceMoveSteps: formValue.limitOrderPriceMoveSteps?.map((x: number) => Number(x)),
      workingVolumes: formValue.workingVolumes?.map((x: number) => Number(x)),
    };

    delete newSettings.instrument;
    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && isInstrumentEqual(initialSettings, newSettings);

    return newSettings as Partial<OrderSubmitSettings>;
  }

  protected setCurrentFormValues(settings: OrderSubmitSettings): void {
    this.form.reset();

    this.form.controls.instrument.setValue({
      symbol: settings.symbol,
      exchange: settings.exchange,
      instrumentGroup: settings.instrumentGroup ?? null
    });
    this.form.controls.instrumentGroup.setValue(settings.instrumentGroup ?? null);

    this.form.controls.enableLimitOrdersFastEditing.setValue(settings.enableLimitOrdersFastEditing ?? false);
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
