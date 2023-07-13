import {
  Component, DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  Observable,
  shareReplay,
  take,
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import {
  MarkerDisplayFormat,
  ScalperOrderBookSettings,
  VolumeHighlightMode,
  VolumeHighlightOption
} from '../../models/scalper-order-book-settings.model';
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-scalper-order-book-settings',
  templateUrl: './scalper-order-book-settings.component.html',
  styleUrls: ['./scalper-order-book-settings.component.less']
})
export class ScalperOrderBookSettingsComponent implements OnInit {
  readonly volumeHighlightModes = VolumeHighlightMode;
  readonly validationOptions = {
    depth: {
      min: 1,
      max: 20
    },
    volumeHighlightOption: {
      boundary: {
        min: 1,
        max: 1000000000
      },
      volumeHighlightFullness: {
        min: 1,
        max: 1000000000
      }
    },
    autoAlignIntervalSec: {
      min: 0,
      max: 600
    }
  };

  readonly availableNumberFormats = Object.values(NumberDisplayFormat);
  readonly availableMarkerFormats = Object.values(MarkerDisplayFormat);

  @Input({required: true})
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();
  form!: UntypedFormGroup;
  exchanges: string[] = exchangesList;
  readonly availableVolumeHighlightModes: string[] = [
    VolumeHighlightMode.Off,
    VolumeHighlightMode.BiggestVolume,
    VolumeHighlightMode.VolumeBoundsWithFixedValue,
  ];

  private settings$!: Observable<ScalperOrderBookSettings>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  get volumeHighlightOptions(): UntypedFormArray {
    return this.form.controls.volumeHighlightOptions as UntypedFormArray;
  }

  get workingVolumes(): UntypedFormArray {
    return this.form.controls.workingVolumes as UntypedFormArray;
  }

  get canRemoveVolumeHighlightOption(): boolean {
    return this.volumeHighlightOptions.length > 1;
  }

  workingVolumeCtrl(index: number): UntypedFormControl {
    return this.workingVolumes.at(index) as UntypedFormControl;
  }

  ngOnInit() {
    this.settings$ = this.settingsService.getSettings<ScalperOrderBookSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.buildForm(settings);
    });
  }

  asFormGroup(control: AbstractControl): UntypedFormGroup {
    return control as UntypedFormGroup;
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
        depth: Number(formValue.depth),
        volumeHighlightOptions: formValue.volumeHighlightOptions.map((x: VolumeHighlightOption) => ({
            ...x,
            boundary: Number(x.boundary)
          } as VolumeHighlightOption)
        ),
        volumeHighlightFullness: Number(formValue.volumeHighlightFullness),
        workingVolumes: formValue.workingVolumes.map((wv: string) => Number(wv)),
        autoAlignIntervalSec: !!(+formValue.autoAlignIntervalSec) ? Number(formValue.autoAlignIntervalSec) : null
      };

      delete newSettings.instrument;
      newSettings.linkToActive = initialSettings.linkToActive && isInstrumentEqual(initialSettings, newSettings);

      this.settingsService.updateSettings<ScalperOrderBookSettings>(this.guid, newSettings);
      this.settingsChange.emit();
    });
  }

  setVolumeHighlightOptionColor(index: number, color: string) {
    const formGroup = this.volumeHighlightOptions.controls[index] as UntypedFormGroup;
    formGroup.controls.color.setValue(color);
  }

  addVolumeHighlightOption($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();

    const defaultValue = this.volumeHighlightOptions.controls[this.volumeHighlightOptions.controls.length - 1].value as VolumeHighlightOption;
    this.volumeHighlightOptions.push(this.createVolumeHighlightOptionsControl(defaultValue));
  }

  removeVolumeHighlightOption($event: MouseEvent, index: number) {
    $event.preventDefault();
    $event.stopPropagation();

    this.volumeHighlightOptions.removeAt(index);
  }

  showVolumeHighlightOptions() {
    return this.form?.value.volumeHighlightMode === VolumeHighlightMode.VolumeBoundsWithFixedValue;
  }

  showRulerOptions() {
    return this.form?.value.showRuler === true;
  }

  hasVolumeHighlightOptionsErrors() {
    return !this.form?.controls?.volumeHighlightOptions?.valid || !this.form?.controls?.volumeHighlightFullness?.valid;
  }

  instrumentSelected(instrument: InstrumentKey | null) {
    this.form.controls.exchange.setValue(instrument?.exchange ?? null);
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
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
    workingVolumeControl.push(this.createWorkingVolumeControl((defaultValue * 10) ?? 1));
  }

  asFormArray(control: AbstractControl): UntypedFormArray {
    return control as UntypedFormArray;
  }

  private buildForm(settings: ScalperOrderBookSettings) {
    this.form = new UntypedFormGroup({
      instrument: new UntypedFormControl({
        symbol: settings.symbol,
        exchange: settings.exchange,
        instrumentGroup: settings.instrumentGroup
      } as InstrumentKey, Validators.required),
      exchange: new UntypedFormControl({ value: settings.exchange, disabled: true }, Validators.required),
      depth: new UntypedFormControl(settings.depth, [Validators.required,
        Validators.min(this.validationOptions.depth.min),
        Validators.max(this.validationOptions.depth.max)]),
      instrumentGroup: new UntypedFormControl(settings.instrumentGroup),
      showZeroVolumeItems: new UntypedFormControl(settings.showZeroVolumeItems),
      showSpreadItems: new UntypedFormControl(settings.showSpreadItems),
      volumeHighlightMode: new UntypedFormControl(settings.volumeHighlightMode ?? VolumeHighlightMode.Off),
      volumeHighlightFullness: new UntypedFormControl(
        settings.volumeHighlightFullness ?? 1000,
        [
          Validators.required,
          Validators.min(this.validationOptions.volumeHighlightOption.volumeHighlightFullness.min),
          Validators.max(this.validationOptions.volumeHighlightOption.volumeHighlightFullness.max)
        ]),
      volumeHighlightOptions: new UntypedFormArray(
        [...settings.volumeHighlightOptions]
          .sort((a, b) => a.boundary - b.boundary)
          .map(x => this.createVolumeHighlightOptionsControl(x))
      ),
      workingVolumes: new UntypedFormArray(settings.workingVolumes.map(wv => this.createWorkingVolumeControl(wv))),
      disableHotkeys: new UntypedFormControl(settings.disableHotkeys),
      enableMouseClickSilentOrders: new UntypedFormControl(settings.enableMouseClickSilentOrders),
      autoAlignIntervalSec: new UntypedFormControl(
        settings.autoAlignIntervalSec,
        [
          Validators.min(this.validationOptions.autoAlignIntervalSec.min),
          Validators.max(this.validationOptions.autoAlignIntervalSec.max)
        ]
      ),
      showTradesPanel: new UntypedFormControl(settings.showTradesPanel ?? false),
      showTradesClustersPanel: new UntypedFormControl(settings.showTradesClustersPanel ?? false),
      volumeDisplayFormat: new UntypedFormControl(settings.volumeDisplayFormat ?? NumberDisplayFormat.Default),
      showRuler: new UntypedFormControl(settings.showRuler ?? false),
      rulerSettings: new UntypedFormGroup({
        markerDisplayFormat: new UntypedFormControl(
          settings.rulerSettings?.markerDisplayFormat ?? MarkerDisplayFormat.Points
        )
      })
    });
  }

  private createVolumeHighlightOptionsControl(option?: VolumeHighlightOption): AbstractControl {
    return new UntypedFormGroup({
      boundary: new UntypedFormControl(
        option?.boundary,
        [
          Validators.required,
          Validators.min(this.validationOptions.volumeHighlightOption.boundary.min),
          Validators.max(this.validationOptions.volumeHighlightOption.boundary.max)
        ]),
      color: new UntypedFormControl(option?.color, Validators.required)
    });
  }

  private createWorkingVolumeControl(value: number | null): UntypedFormControl {
    return new UntypedFormControl(value, [Validators.required, Validators.min(1)]);
  }
}
