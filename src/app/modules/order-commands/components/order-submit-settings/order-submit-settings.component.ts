import {Component, DestroyRef, OnInit} from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import {Observable, shareReplay, take} from "rxjs";
import {inputNumberValidation} from "../../../../shared/utils/validation-options";
import {OrderSubmitSettings} from "../../models/order-submit-settings.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DeviceService} from "../../../../shared/services/device.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {isInstrumentEqual} from "../../../../shared/utils/settings-helper";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";

@Component({
  selector: 'ats-order-submit-settings',
  templateUrl: './order-submit-settings.component.html',
  styleUrls: ['./order-submit-settings.component.less']
})
export class OrderSubmitSettingsComponent extends WidgetSettingsBaseComponent<OrderSubmitSettings> implements OnInit {
  form!: UntypedFormGroup;
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
    private readonly deviceService: DeviceService,
    private readonly destroyRef: DestroyRef
  ) {
    super(settingsService, manageDashboardsService);
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form?.valid ?? false;
  }

  ngOnInit() {
    this.deviceInfo$ = this.deviceService.deviceInfo$
      .pipe(
        take(1)
      );

    this.settings$ = this.settingsService.getSettings<OrderSubmitSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.form = new UntypedFormGroup({
        instrument: new UntypedFormControl({
          symbol: settings.symbol,
          exchange: settings.exchange,
          instrumentGroup: settings.instrumentGroup
        } as InstrumentKey, Validators.required),
        exchange: new UntypedFormControl({value: settings.exchange, disabled: true}, Validators.required),
        instrumentGroup: new UntypedFormControl(settings.instrumentGroup),
        enableLimitOrdersFastEditing: new UntypedFormControl(settings.enableLimitOrdersFastEditing ?? false),
        limitOrderPriceMoveSteps: new FormArray(
          [...(settings.limitOrderPriceMoveSteps ?? [1])]
            .sort((a, b) => a - b)
            .map(x => this.createLimitOrderPriceMoveStepControl(x)
            )
        ),
        showVolumePanel: new UntypedFormControl(settings.showVolumePanel ?? false),
        workingVolumes: new FormArray(
          [...(settings.workingVolumes ?? [])]
            .sort((a, b) => a - b)
            .map(x => this.createWorkingVolumeControl(x)
            )
        )
      });
    });
  }

  instrumentSelected(instrument: InstrumentKey | null) {
    this.form.controls.exchange.setValue(instrument?.exchange ?? null);
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  asFormArray(control: AbstractControl): UntypedFormArray {
    return control as UntypedFormArray;
  }

  asFormControl(control: AbstractControl): UntypedFormControl {
    return control as UntypedFormControl;
  }

  removeLimitOrderPriceMoveStep($event: MouseEvent, index: number) {
    $event.preventDefault();
    $event.stopPropagation();

    this.asFormArray(this.form.controls.limitOrderPriceMoveSteps).removeAt(index);
  }

  addLimitOrderPriceMoveStep($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();

    const stepsControl = this.asFormArray(this.form.controls.limitOrderPriceMoveSteps);
    const defaultValue = stepsControl.controls[stepsControl.length - 1].value as number;
    stepsControl.push(this.createLimitOrderPriceMoveStepControl(defaultValue));
  }

  removeWorkingVolume($event: MouseEvent, index: number) {
    $event.preventDefault();
    $event.stopPropagation();

    this.asFormArray(this.form.controls.workingVolumes).removeAt(index);
  }

  addWorkingVolume($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();

    const workingVolumeControl = this.asFormArray(this.form.controls.workingVolumes);
    const defaultValue = workingVolumeControl?.controls[workingVolumeControl.length - 1]?.value as number;
    workingVolumeControl.push(this.createWorkingVolumeControl(defaultValue ?? 1));
  }

  protected getUpdatedSettings(initialSettings: OrderSubmitSettings): Partial<OrderSubmitSettings> {
    const formValue = this.form.value;

    const newSettings = {
      ...formValue,
      symbol: formValue.instrument.symbol,
      exchange: formValue.instrument.exchange,
      limitOrderPriceMoveSteps: formValue.limitOrderPriceMoveSteps.map((x: number) => Number(x)),
      workingVolumes: formValue.workingVolumes.map((x: number) => Number(x)),
    };

    delete newSettings.instrument;
    newSettings.linkToActive = initialSettings.linkToActive && isInstrumentEqual(initialSettings, newSettings);

    return newSettings;
  }

  private createLimitOrderPriceMoveStepControl(defaultValue: number): FormControl<number | null> {
    return new FormControl(
      defaultValue,
      [
        Validators.required,
        Validators.min(this.validationOptions.limitOrderPriceMoveStep.min),
        Validators.max(this.validationOptions.limitOrderPriceMoveStep.max)
      ]
    );
  }

  private createWorkingVolumeControl(defaultValue: number): FormControl<number | null> {
    return new FormControl(
      defaultValue,
      [
        Validators.required,
        Validators.min(this.validationOptions.workingVolume.min),
        Validators.max(this.validationOptions.workingVolume.max)
      ]
    );
  }
}
