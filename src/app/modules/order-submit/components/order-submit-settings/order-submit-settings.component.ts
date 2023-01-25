import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import {
  Observable,
  shareReplay,
  Subject,
  take,
  takeUntil
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { inputNumberValidation } from '../../../../shared/utils/validation-options';
import { OrderSubmitSettings } from '../../models/order-submit-settings.model';

@Component({
  selector: 'ats-order-submit-settings[settingsChange][guid]',
  templateUrl: './order-submit-settings.component.html',
  styleUrls: ['./order-submit-settings.component.less']
})
export class OrderSubmitSettingsComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();
  form!: UntypedFormGroup;
  exchanges: string[] = exchangesList;

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

  private readonly destroy$: Subject<boolean> = new Subject<boolean>();
  private settings$!: Observable<OrderSubmitSettings>;

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit() {
    this.settings$ = this.settingsService.getSettings<OrderSubmitSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.settings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.form = new UntypedFormGroup({
        instrument: new UntypedFormControl({
          symbol: settings.symbol,
          exchange: settings.exchange,
          instrumentGroup: settings.instrumentGroup
        } as InstrumentKey, Validators.required),
        exchange: new UntypedFormControl({ value: settings.exchange, disabled: true }, Validators.required),
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

  submitForm(): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
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

      this.settingsService.updateSettings<OrderSubmitSettings>(this.guid, newSettings);
      this.settingsChange.emit();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
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
