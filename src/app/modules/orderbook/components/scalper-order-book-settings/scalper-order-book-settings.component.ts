import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  Subject,
  takeUntil
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  Validators
} from "@angular/forms";
import {
  ScalperOrderBookSettings,
  VolumeHighlightMode,
  VolumeHighlightOption
} from "../../../../shared/models/settings/scalper-order-book-settings.model";
import { exchangesList } from "../../../../shared/models/enums/exchanges";

interface SettingsFormData {
  depth: number;
  exchange: string;
  symbol: string;
  instrumentGroup: string;
  showYieldForBonds: boolean;
  showZeroVolumeItems: boolean;
  showSpreadItems: boolean;
  volumeHighlightMode: VolumeHighlightMode;
  volumeHighlightOptions: VolumeHighlightOption[];
  volumeHighlightFullness: number;
  workingVolumes: number[];
  disableHotkeys: boolean;
  enableMouseClickSilentOrders: boolean;
}

type SettingsFormControls = { [key in keyof SettingsFormData]: AbstractControl };
type SettingsFormGroup = FormGroup & { value: SettingsFormData, controls: SettingsFormControls };

@Component({
  selector: 'ats-scalper-order-book-settings[settingsChange][guid]',
  templateUrl: './scalper-order-book-settings.component.html',
  styleUrls: ['./scalper-order-book-settings.component.less']
})
export class ScalperOrderBookSettingsComponent implements OnInit, OnDestroy {
  readonly volumeHighlightModes = VolumeHighlightMode;
  readonly validationSettings = {
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
    depth: {
      min: 0,
      max: 20
    }
  };

  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();

  form!: SettingsFormGroup;
  exchanges: string[] = exchangesList;

  readonly availableVolumeHighlightModes: { label: string, value: string }[] = [
    { label: 'Отключено', value: VolumeHighlightMode.Off },
    { label: 'Относительно наибольшего объема', value: VolumeHighlightMode.BiggestVolume },
    { label: 'По границам (более объема)', value: VolumeHighlightMode.VolumeBoundsWithFixedValue },
  ];

  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  get volumeHighlightOptions(): FormArray {
    return this.form.controls.volumeHighlightOptions as FormArray;
  }

  get workingVolumes(): FormArray {
    return this.form.controls.workingVolumes as FormArray;
  }

  workingVolumeCtrl(index: number): FormControl {
    return this.workingVolumes.at(index) as FormControl;
  }

  ngOnInit() {
    this.settingsService.getSettings<ScalperOrderBookSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.buildForm(settings);
    });
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  submitForm(): void {
    this.settingsService.updateSettings(
      this.guid,
      {
        ...this.form.value,
        depth: Number(this.form.value.depth),
        volumeHighlightOptions: this.form.value.volumeHighlightOptions.map((x: VolumeHighlightOption) => ({
            ...x,
            boundary: Number(x.boundary)
          } as VolumeHighlightOption)
        ),
        volumeHighlightFullness: Number(this.form.value.volumeHighlightFullness),
        workingVolumes: this.form.value.workingVolumes.map((wv: string) => Number(wv)),
        linkToActive: false
      });

    this.settingsChange.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  setVolumeHighlightOptionColor(index: number, color: string) {
    const formGroup = this.volumeHighlightOptions.controls[index] as FormGroup;
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

  hasVolumeHighlightOptionsErrors(){
    return !this.form?.controls?.volumeHighlightOptions?.valid || !this.form?.controls?.volumeHighlightFullness?.valid;
  }

  private buildForm(settings: ScalperOrderBookSettings) {
    this.form = new FormGroup({
      symbol: new FormControl(settings.symbol, [
        Validators.required,
        Validators.minLength(1)
      ]),
      exchange: new FormControl(settings.exchange, Validators.required),
      depth: new FormControl(settings.depth, [Validators.required,
        Validators.min(this.validationSettings.depth.min),
        Validators.max(this.validationSettings.depth.max)]),
      instrumentGroup: new FormControl(settings.instrumentGroup),
      showYieldForBonds: new FormControl(settings.showYieldForBonds),
      showZeroVolumeItems: new FormControl(settings.showZeroVolumeItems),
      showSpreadItems: new FormControl(settings.showSpreadItems),
      volumeHighlightMode: new FormControl(settings.volumeHighlightMode ?? VolumeHighlightMode.Off),
      volumeHighlightFullness: new FormControl(
        settings.volumeHighlightFullness ?? 1000,
        [
          Validators.required,
          Validators.min(this.validationSettings.volumeHighlightOption.volumeHighlightFullness.min),
          Validators.max(this.validationSettings.volumeHighlightOption.volumeHighlightFullness.max)
        ]),
      volumeHighlightOptions: new FormArray(
        [...settings.volumeHighlightOptions]
        .sort((a, b) => a.boundary - b.boundary)
        .map(x => this.createVolumeHighlightOptionsControl(x))
      ),
      workingVolumes: new FormArray(settings.workingVolumes.map(
        wv => new FormControl(wv, [Validators.required, Validators.min(1)])
      )),
      disableHotkeys: new FormControl(settings.disableHotkeys),
      enableMouseClickSilentOrders: new FormControl(settings.enableMouseClickSilentOrders),
    } as SettingsFormControls) as SettingsFormGroup;
  }

  private createVolumeHighlightOptionsControl(option?: VolumeHighlightOption): AbstractControl {
    return new FormGroup({
      boundary: new FormControl(
        option?.boundary,
        [
          Validators.required,
          Validators.min(this.validationSettings.volumeHighlightOption.boundary.min),
          Validators.max(this.validationSettings.volumeHighlightOption.boundary.max)
        ]),
      color: new FormControl(option?.color, Validators.required)
    });
  }
}
