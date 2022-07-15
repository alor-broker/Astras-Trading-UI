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
  VerticalOrderBookSettings,
  VolumeHighlightOption
} from "../../../../shared/models/settings/vertical-order-book-settings.model";

interface SettingsFormData {
  depth: number;
  exchange: string;
  symbol: string;
  instrumentGroup: string;
  showYieldForBonds: boolean;
  showZeroVolumeItems: boolean;
  showSpreadItems: boolean;
  highlightHighVolume: boolean;
  volumeHighlightOptions: VolumeHighlightOption[];
  workingVolumes: number[];
}

type SettingsFormControls = { [key in keyof SettingsFormData]: AbstractControl };
type SettingsFormGroup = FormGroup & { value: SettingsFormData, controls: SettingsFormControls };

@Component({
  selector: 'ats-vertical-order-book-settings[settingsChange][guid]',
  templateUrl: './vertical-order-book-settings.component.html',
  styleUrls: ['./vertical-order-book-settings.component.less']
})
export class VerticalOrderBookSettingsComponent implements OnInit, OnDestroy {
  readonly validationSettings = {
    volumeHighlightOption: {
      boundary: {
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
    this.settingsService.getSettings<VerticalOrderBookSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
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
        highlightHighVolume: new FormControl(settings.highlightHighVolume),
        volumeHighlightOptions: new FormArray(
          [...settings.volumeHighlightOptions]
            .sort((a, b) => a.boundary - b.boundary)
            .map(x => this.createVolumeHighlightOptionsControl(x))
        ),
        workingVolumes: new FormArray(settings.workingVolumes.map(
          wv => new FormControl(wv, [Validators.required, Validators.min(1)])
        )),
      } as SettingsFormControls) as SettingsFormGroup;
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
