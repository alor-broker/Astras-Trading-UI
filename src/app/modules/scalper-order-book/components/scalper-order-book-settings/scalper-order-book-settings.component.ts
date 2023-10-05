import { Component, DestroyRef, OnInit } from '@angular/core';
import {
  Observable
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { AbstractControl, UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import {
  InstrumentLinkedSettings,
  PriceUnits,
  ScalperOrderBookWidgetSettings,
  VolumeHighlightMode,
  VolumeHighlightOption
} from '../../models/scalper-order-book-settings.model';
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AtsValidators } from "../../../../shared/utils/form-validators";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { TechChartSettings } from "../../../tech-chart/models/tech-chart-settings.model";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { ScalperSettingsHelper } from "../../utils/scalper-settings.helper";

@Component({
  selector: 'ats-scalper-order-book-settings',
  templateUrl: './scalper-order-book-settings.component.html',
  styleUrls: ['./scalper-order-book-settings.component.less']
})
export class ScalperOrderBookSettingsComponent extends WidgetSettingsBaseComponent<ScalperOrderBookWidgetSettings> implements OnInit {
  readonly volumeHighlightModes = VolumeHighlightMode;
  readonly validationOptions = {
    depth: {
      min: 1,
      max: 20
    },
    volumeHighlightOption: {
      boundary: {
        min: 1,
        max: 1_000_000_000
      },
      volumeHighlightFullness: {
        min: 1,
        max: 1_000_000_000
      }
    },
    autoAlignIntervalSec: {
      min: 0,
      max: 600
    },
    bracket: {
      price: {
        min: 0,
        max: 1_000_000_000,
        percentsStep: 0.01,
        stepsStep: 1
      }
    }
  };

  readonly availableNumberFormats = Object.values(NumberDisplayFormat);

  form!: UntypedFormGroup;
  orderPriceUnits = PriceUnits;
  exchanges: string[] = exchangesList;
  readonly availableVolumeHighlightModes: string[] = [
    VolumeHighlightMode.Off,
    VolumeHighlightMode.BiggestVolume,
    VolumeHighlightMode.VolumeBoundsWithFixedValue,
  ];

  protected settings$!: Observable<ScalperOrderBookWidgetSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
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
    this.initSettingsStream();

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.buildForm(settings);
    });
  }

  asFormGroup(control: AbstractControl): UntypedFormGroup {
    return control as UntypedFormGroup;
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

  protected initSettingsStream(){
    this.settings$ = ScalperSettingsHelper.getSettingsStream(this.guid, this.settingsService);
  }

  protected getUpdatedSettings(initialSettings: TechChartSettings): Partial<ScalperOrderBookWidgetSettings> {
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
      autoAlignIntervalSec: !!(+formValue.autoAlignIntervalSec) ? Number(formValue.autoAlignIntervalSec) : null,
      topOrderPriceRatio: !!(+formValue.topOrderPriceRatio) ? Number(formValue.topOrderPriceRatio) : null,
      bottomOrderPriceRatio: !!(+formValue.bottomOrderPriceRatio) ? Number(formValue.bottomOrderPriceRatio) : null
    };

    delete newSettings.instrument;
    newSettings.linkToActive = initialSettings.linkToActive && isInstrumentEqual(initialSettings, newSettings);

    newSettings.instrumentLinkedSettings = {
      ...initialSettings.instrumentLinkedSettings,
      [ScalperSettingsHelper.getInstrumentKey(newSettings)]: {
        depth: newSettings.depth,
        showZeroVolumeItems: newSettings.showZeroVolumeItems,
        showSpreadItems: newSettings.showSpreadItems,
        volumeHighlightMode: newSettings.volumeHighlightMode,
        volumeHighlightOptions: newSettings.volumeHighlightOptions,
        volumeHighlightFullness: newSettings.volumeHighlightFullness,
        workingVolumes: newSettings.workingVolumes,
        tradesClusterPanelSettings: initialSettings.tradesClusterPanelSettings,
        bracketsSettings: newSettings.bracketsSettings,
      } as InstrumentLinkedSettings
    };

    return newSettings;
  }

  private buildForm(settings: ScalperOrderBookWidgetSettings) {
    const stepsPriceStepValidatorFn = AtsValidators.priceStepMultiplicity(this.validationOptions.bracket.price.stepsStep);
    const percentsPriceStepValidatorFn = AtsValidators.priceStepMultiplicity(this.validationOptions.bracket.price.percentsStep);

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
          settings.rulerSettings?.markerDisplayFormat ?? PriceUnits.Points
        )
      }),
      showPriceWithZeroPadding: new UntypedFormControl(settings.showPriceWithZeroPadding ?? false),
      useBrackets: new UntypedFormControl(settings.useBrackets ?? false),
      bracketsSettings: new UntypedFormGroup({
        orderPriceUnits: new UntypedFormControl(settings.bracketsSettings?.orderPriceUnits ?? PriceUnits.Points),
        topOrderPriceRatio: new UntypedFormControl(
          settings.bracketsSettings?.topOrderPriceRatio ?? null,
          [
            Validators.min(this.validationOptions.bracket.price.min),
            Validators.max(this.validationOptions.bracket.price.max),
            settings.bracketsSettings?.orderPriceUnits === PriceUnits.Percents
              ? percentsPriceStepValidatorFn
              : stepsPriceStepValidatorFn
          ]
        ),
        bottomOrderPriceRatio: new UntypedFormControl(
          settings.bracketsSettings?.bottomOrderPriceRatio ?? null,
          [
            Validators.min(this.validationOptions.bracket.price.min),
            Validators.max(this.validationOptions.bracket.price.max),
            settings.bracketsSettings?.orderPriceUnits === PriceUnits.Percents
              ? percentsPriceStepValidatorFn
              : stepsPriceStepValidatorFn
          ]
        ),
        useBracketsWhenClosingPosition: new UntypedFormControl(settings.bracketsSettings?.useBracketsWhenClosingPosition ?? false)
      })
    });

    this.form.get('bracketsSettings')!.get('orderPriceUnits')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: PriceUnits) => {
        const topOrderPriceRatioControl = this.form.get('bracketsSettings')!.get('topOrderPriceRatio');
        const bottomOrderPriceRatioControl = this.form.get('bracketsSettings')!.get('bottomOrderPriceRatio');

        topOrderPriceRatioControl?.removeValidators([percentsPriceStepValidatorFn, stepsPriceStepValidatorFn]);
        bottomOrderPriceRatioControl?.removeValidators([percentsPriceStepValidatorFn, stepsPriceStepValidatorFn]);

        topOrderPriceRatioControl?.addValidators(value === PriceUnits.Percents ? percentsPriceStepValidatorFn : stepsPriceStepValidatorFn);
        bottomOrderPriceRatioControl?.addValidators(value === PriceUnits.Percents ? percentsPriceStepValidatorFn : stepsPriceStepValidatorFn);

        topOrderPriceRatioControl?.updateValueAndValidity();
        bottomOrderPriceRatioControl?.updateValueAndValidity();
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
