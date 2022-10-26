import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  Observable,
  shareReplay,
  Subject,
  take,
  takeUntil
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import {
  ScalperOrderBookSettings,
  VolumeHighlightMode,
  VolumeHighlightOption
} from "../../../../shared/models/settings/scalper-order-book-settings.model";
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import { InstrumentValidation } from '../../../../shared/utils/validation-options';
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';

interface SettingsFormData {
  depth: number;
  exchange: string;
  symbol: string;
  instrumentGroup: string;
  showZeroVolumeItems: boolean;
  showSpreadItems: boolean;
  volumeHighlightMode: VolumeHighlightMode;
  volumeHighlightOptions: VolumeHighlightOption[];
  volumeHighlightFullness: number;
  workingVolumes: number[];
  disableHotkeys: boolean;
  enableMouseClickSilentOrders: boolean;
  autoAlignIntervalSec?: number;
}

type SettingsFormControls = { [key in keyof SettingsFormData]: AbstractControl };
type SettingsFormGroup = UntypedFormGroup & { value: SettingsFormData, controls: SettingsFormControls };

@Component({
  selector: 'ats-scalper-order-book-settings[settingsChange][guid]',
  templateUrl: './scalper-order-book-settings.component.html',
  styleUrls: ['./scalper-order-book-settings.component.less']
})
export class ScalperOrderBookSettingsComponent implements OnInit, OnDestroy {
  readonly volumeHighlightModes = VolumeHighlightMode;
  readonly validationOptions = {
    ...InstrumentValidation,
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

  private settings$!: Observable<ScalperOrderBookSettings>;
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
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
      takeUntil(this.destroy$)
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
      const newSettings = {
        ...this.form.value,
        depth: Number(this.form.value.depth),
        volumeHighlightOptions: this.form.value.volumeHighlightOptions.map((x: VolumeHighlightOption) => ({
            ...x,
            boundary: Number(x.boundary)
          } as VolumeHighlightOption)
        ),
        volumeHighlightFullness: Number(this.form.value.volumeHighlightFullness),
        workingVolumes: this.form.value.workingVolumes.map((wv: string) => Number(wv)),
        autoAlignIntervalSec: !!(+this.form.value.autoAlignIntervalSec) ? Number(this.form.value.autoAlignIntervalSec) : null
      };

      newSettings.linkToActive = isInstrumentEqual(initialSettings, newSettings);

      this.settingsService.updateSettings<ScalperOrderBookSettings>(this.guid, newSettings);
      this.settingsChange.emit();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
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

  hasVolumeHighlightOptionsErrors() {
    return !this.form?.controls?.volumeHighlightOptions?.valid || !this.form?.controls?.volumeHighlightFullness?.valid;
  }

  private buildForm(settings: ScalperOrderBookSettings) {
    this.form = new UntypedFormGroup({
      symbol: new UntypedFormControl(settings.symbol, [
        Validators.required,
        Validators.minLength(this.validationOptions.symbol.min),
        Validators.maxLength(this.validationOptions.symbol.max)
      ]),
      exchange: new UntypedFormControl(settings.exchange, Validators.required),
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
      workingVolumes: new UntypedFormArray(settings.workingVolumes.map(
        wv => new UntypedFormControl(wv, [Validators.required, Validators.min(1)])
      )),
      disableHotkeys: new UntypedFormControl(settings.disableHotkeys),
      enableMouseClickSilentOrders: new UntypedFormControl(settings.enableMouseClickSilentOrders),
      autoAlignIntervalSec: new UntypedFormControl(
        settings.autoAlignIntervalSec,
        [
          Validators.min(this.validationOptions.autoAlignIntervalSec.min),
          Validators.max(this.validationOptions.autoAlignIntervalSec.max)
        ]
      ),
    } as SettingsFormControls) as SettingsFormGroup;
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
}
