import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  distinctUntilChanged,
  Observable,
  shareReplay,
  take
} from "rxjs";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from "@angular/forms";
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import {
  InstrumentLinkedSettings,
  PanelSlots,
  PriceUnits,
  ScalperOrderBookWidgetSettings,
  VolumeHighlightMode,
  VolumeHighlightOption
} from '../../models/scalper-order-book-settings.model';
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { WidgetSettingsFormComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { NzMarks } from "ng-zorro-antd/slider";
import { ScalperOrderBookConstants } from "../../constants/scalper-order-book.constants";
import { ScalperOrderBookSettingsReadService } from "../../services/scalper-order-book-settings-read.service";
import { ScalperOrderBookSettingsWriteService } from "../../services/scalper-order-book-settings-write.service";
import { map } from "rxjs/operators";

@Component({
  selector: 'ats-scalper-order-book-settings',
  templateUrl: './scalper-order-book-settings.component.html',
  styleUrls: ['./scalper-order-book-settings.component.less']
})
export class ScalperOrderBookSettingsComponent implements WidgetSettingsFormComponent, OnInit {
  @Input({required: true})
  guid!: string;

  @Output()
  settingsChange = new EventEmitter<void>();

  readonly volumeHighlightModes = VolumeHighlightMode;

  readonly validationOptions = {
    depth: {
      min: 1,
      max: 50
    },
    workingVolume: {
      min: 1,
      max: inputNumberValidation.max
    },
    volumeHighlightOption: {
      boundary: {
        min: 1,
        max: inputNumberValidation.max
      },
      volumeHighlightFullness: {
        min: 1,
        max: inputNumberValidation.max
      }
    },
    autoAlignIntervalSec: {
      min: 1,
      max: 600
    },
    shortLongIndicators: {
      min: 5,
      max: 60
    },
    fontSize: {
      min: 10,
      max: 14
    },
    rowHeight: {
      min: 12,
      max: 20
    },
    minorLinesStep: {
      min: 1,
      max: inputNumberValidation.max
    },
    majorLinesStep: {
      min: 1,
      max: inputNumberValidation.max
    },
    bracket: {
      price: {
        min: 0.01,
        max: inputNumberValidation.max,
        percentsStep: 0.01,
        stepsStep: 1
      }
    },
    tradesPanelSettings: {
      minTradeVolumeFilter: {
        min: 0,
        max: inputNumberValidation.max
      },
      tradesAggregationPeriodMs: {
        min: 0,
        max: 60 * 60 * 1000
      }
    },
    stopLimitOrdersDistance: {
      min: 0,
      max: 100
    }
  };

  readonly availableNumberFormats = Object.values(NumberDisplayFormat);

  readonly workingVolumesPanelSlots = [PanelSlots.BottomFloatingPanel, PanelSlots.TopPanel];

  readonly shortLongPanelSlots = [PanelSlots.BottomFloatingPanel, PanelSlots.TopPanel];

  readonly orderPriceUnits = PriceUnits;

  readonly availableVolumeHighlightModes: string[] = [
    VolumeHighlightMode.Off,
    VolumeHighlightMode.BiggestVolume,
    VolumeHighlightMode.VolumeBoundsWithFixedValue,
  ];

  readonly form = this.formBuilder.group({
    // instrument
    instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
    instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
    // view
    depth: this.formBuilder.nonNullable.control(
      10,
      [
        Validators.required,
        Validators.min(this.validationOptions.depth.min),
        Validators.max(this.validationOptions.depth.max)
      ]
    ),
    showZeroVolumeItems: this.formBuilder.nonNullable.control(true),
    showSpreadItems: this.formBuilder.nonNullable.control(true),
    showInstrumentPriceDayChange: this.formBuilder.nonNullable.control(true),
    showShortLongIndicators: this.formBuilder.nonNullable.control(true),
    shortLongIndicatorsPanelSlot: this.formBuilder.nonNullable.control(PanelSlots.BottomFloatingPanel),
    shortLongIndicatorsUpdateIntervalSec: this.formBuilder.nonNullable.control(
      60,
      [
        Validators.required,
        Validators.min(this.validationOptions.shortLongIndicators.min),
        Validators.max(this.validationOptions.shortLongIndicators.max)
      ]
    ),
    showLimitOrdersVolumeIndicators: this.formBuilder.nonNullable.control(true),
    volumeDisplayFormat: this.formBuilder.nonNullable.control(NumberDisplayFormat.Default),
    showRuler: this.formBuilder.nonNullable.control(true),
    rulerSettings: this.formBuilder.nonNullable.group(
      {
        markerDisplayFormat: this.formBuilder.nonNullable.control(PriceUnits.Points)
      },
      {
        validators: Validators.required
      }
    ),
    enableAutoAlign: this.formBuilder.nonNullable.control(true),
    autoAlignIntervalSec: this.formBuilder.nonNullable.control(
      15,
      [
        Validators.required,
        Validators.min(this.validationOptions.autoAlignIntervalSec.min),
        Validators.max(this.validationOptions.autoAlignIntervalSec.max)
      ]
    ),
    showPriceWithZeroPadding: this.formBuilder.nonNullable.control(false),
    hideTooltips: this.formBuilder.nonNullable.control(false),
    fontSize: this.formBuilder.nonNullable.control(
      12,
      [
        Validators.required,
        Validators.min(this.validationOptions.fontSize.min),
        Validators.max(this.validationOptions.fontSize.max)
      ]
    ),
    rowHeight: this.formBuilder.nonNullable.control(
      18,
      [
        Validators.required,
        Validators.min(this.validationOptions.rowHeight.min),
        Validators.max(this.validationOptions.rowHeight.max)
      ]
    ),
    minorLinesStep: this.formBuilder.nonNullable.control(
      5,
      [
        Validators.required,
        Validators.min(this.validationOptions.minorLinesStep.min),
        Validators.max(this.validationOptions.minorLinesStep.max)
      ]
    ),
    majorLinesStep: this.formBuilder.nonNullable.control(
      10,
      [
        Validators.required,
        Validators.min(this.validationOptions.majorLinesStep.min),
        Validators.max(this.validationOptions.majorLinesStep.max)
      ]
    ),
    // orders
    disableHotkeys: this.formBuilder.nonNullable.control(true),
    enableMouseClickSilentOrders: this.formBuilder.nonNullable.control(false),
    stopLimitOrdersDistance: this.formBuilder.nonNullable.control(
      0,
      [
        Validators.min(this.validationOptions.stopLimitOrdersDistance.min),
        Validators.max(this.validationOptions.stopLimitOrdersDistance.max)
      ]
    ),
    // additional panels
    showTradesClustersPanel: this.formBuilder.nonNullable.control(false),
    showTradesPanel: this.formBuilder.nonNullable.control(false),
    tradesPanelSettings: this.formBuilder.nonNullable.group(
      {
        minTradeVolumeFilter: this.formBuilder.nonNullable.control(
          0,
          [
            Validators.required,
            Validators.min(this.validationOptions.tradesPanelSettings.minTradeVolumeFilter.min),
            Validators.max(this.validationOptions.tradesPanelSettings.minTradeVolumeFilter.max)
          ]
        ),
        hideFilteredTrades: this.formBuilder.nonNullable.control(false),
        tradesAggregationPeriodMs: this.formBuilder.nonNullable.control(
          0,
          [
            Validators.required,
            Validators.min(this.validationOptions.tradesPanelSettings.tradesAggregationPeriodMs.min),
            Validators.max(this.validationOptions.tradesPanelSettings.tradesAggregationPeriodMs.max)
          ]
        ),
        showOwnTrades: this.formBuilder.nonNullable.control(false),
      },
      {validators: Validators.required}
    ),
    // working volumes
    showWorkingVolumesPanel: this.formBuilder.nonNullable.control(true),
    workingVolumesPanelSlot: this.formBuilder.nonNullable.control(PanelSlots.BottomFloatingPanel),
    workingVolumes: this.formBuilder.nonNullable.array(
      [this.createWorkingVolumeControl(1)],
      Validators.minLength(1)
    ),
    // volume highlight
    volumeHighlightMode: this.formBuilder.nonNullable.control(VolumeHighlightMode.Off),
    volumeHighlightFullness: this.formBuilder.nonNullable.control(
      1000,
      [
        Validators.required,
        Validators.min(this.validationOptions.volumeHighlightOption.volumeHighlightFullness.min),
        Validators.max(this.validationOptions.volumeHighlightOption.volumeHighlightFullness.max)
      ]
    ),
    volumeHighlightOptions: this.formBuilder.nonNullable.array(
      [this.createVolumeHighlightOptionsControl({boundary: 1, color: 'red'})],
      Validators.minLength(1)
    ),
    // automation
    bracketsSettings: this.formBuilder.group({
        orderPriceUnits: this.formBuilder.nonNullable.control(PriceUnits.Points),
        topOrderPriceRatio: this.formBuilder.control<number | null>(
          null,
          [
            Validators.min(this.validationOptions.bracket.price.min),
            Validators.max(this.validationOptions.bracket.price.max)
          ]
        ),
        bottomOrderPriceRatio: this.formBuilder.control<number | null>(
          null,
          [
            Validators.min(this.validationOptions.bracket.price.min),
            Validators.max(this.validationOptions.bracket.price.max)
          ]
        ),
        useBracketsWhenClosingPosition: this.formBuilder.nonNullable.control(false),
      },
      {
        validators: [
          Validators.required,
        ]
      }
    )
  });

  protected settings$!: Observable<ScalperOrderBookWidgetSettings>;

  constructor(
    private readonly settingsReadService: ScalperOrderBookSettingsReadService,
    private readonly settingsWriteService: ScalperOrderBookSettingsWriteService,
    private readonly manageDashboardsService: ManageDashboardsService,
    private readonly destroyRef: DestroyRef,
    private readonly formBuilder: FormBuilder,
  ) {
  }

  get canCopy(): boolean {
    return this.canSave;
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form?.valid ?? false;
  }

  get canRemoveVolumeHighlightOption(): boolean {
    return (this.form.value.volumeHighlightOptions?.length ?? 0) > 1;
  }

  ngOnInit(): void {
    this.initSettingsStream();
    this.initCheckFieldsAvailability();

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(settings => {
      this.setCurrentFormValues(settings);
    });
  }

  addVolumeHighlightOption($event: MouseEvent): void {
    $event.preventDefault();
    $event.stopPropagation();

    const defaultValue = {
      boundary: 1,
      color: 'red',
      ...this.form.value.volumeHighlightOptions![this.form.value.volumeHighlightOptions!.length - 1],
    };

    this.form.controls.volumeHighlightOptions.push(this.createVolumeHighlightOptionsControl(defaultValue));
  }

  removeVolumeHighlightOption($event: MouseEvent, index: number): void {
    $event.preventDefault();
    $event.stopPropagation();

    this.form.controls.volumeHighlightOptions.removeAt(index);
  }

  showVolumeHighlightOptions(): boolean {
    return this.form?.value!.volumeHighlightMode === VolumeHighlightMode.VolumeBoundsWithFixedValue;
  }

  showRulerOptions(): boolean {
    return this.form?.value!.showRuler === true;
  }

  hasVolumeHighlightOptionsErrors(): boolean {
    return !(this.form?.controls.volumeHighlightOptions?.valid ?? false) || !(this.form?.controls.volumeHighlightFullness?.valid ?? false);
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
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
    workingVolumeControl.push(this.createWorkingVolumeControl((defaultValue ?? 0) ? defaultValue! * 10 : 1));
  }

  getSliderMarks(minValue: number, maxValue: number): NzMarks {
    return {
      [minValue]: minValue.toString(),
      [maxValue]: maxValue.toString(),
    };
  }

  createWidgetCopy(): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      this.manageDashboardsService.copyWidget(this.getSettingsToCopy(initialSettings));
    });
  }

  updateSettings(): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      const updatedSettings = this.getUpdatedSettings(initialSettings);
      const instrumentKey: InstrumentKey = {
        symbol: updatedSettings.widgetSettings.symbol!,
        exchange: updatedSettings.widgetSettings.exchange!,
        instrumentGroup: updatedSettings.widgetSettings.instrumentGroup!
      };

      this.settingsWriteService.updateInstrumentLinkedSettings(updatedSettings.instrumentLinkedSettings, instrumentKey);
      this.settingsWriteService.updateWidgetSettings(updatedSettings.widgetSettings, this.guid);

      this.settingsChange.emit();
    });
  }

  protected getUpdatedSettings(initialSettings: ScalperOrderBookWidgetSettings): {
    instrumentLinkedSettings: Partial<InstrumentLinkedSettings>;
    widgetSettings: Partial<ScalperOrderBookWidgetSettings>;
  } {
    const formValue = this.form.value!;

    const newSettings = {
      ...formValue,
      symbol: formValue.instrument!.symbol,
      exchange: formValue.instrument!.exchange,
      depth: Number(formValue.depth),
      fontSize: Number(formValue.fontSize),
      rowHeight: Number(formValue.rowHeight),
      stopLimitOrdersDistance: Number(formValue.stopLimitOrdersDistance),
      minorLinesStep:Number(formValue.minorLinesStep),
      majorLinesStep:Number(formValue.majorLinesStep),
    } as Partial<ScalperOrderBookWidgetSettings> & InstrumentKey;

    delete newSettings.instrument;

    if (formValue.volumeHighlightMode === VolumeHighlightMode.VolumeBoundsWithFixedValue) {
      newSettings.volumeHighlightOptions = formValue.volumeHighlightOptions!.map(x => ({
          ...x,
          boundary: Number(x.boundary!)
        } as VolumeHighlightOption)
      );

      newSettings.volumeHighlightFullness = Number(formValue.volumeHighlightFullness);
    }

    if (formValue.showShortLongIndicators ?? false) {
      newSettings.shortLongIndicatorsUpdateIntervalSec = Number(formValue.shortLongIndicatorsUpdateIntervalSec);
    }

    if (formValue.enableAutoAlign ?? false) {
      newSettings.autoAlignIntervalSec = Number(formValue.autoAlignIntervalSec);
    }

    if ((formValue.bracketsSettings?.topOrderPriceRatio ?? null) != null) {
      newSettings.topOrderPriceRatio = Number(formValue.bracketsSettings!.topOrderPriceRatio);
    }

    if ((formValue.bracketsSettings?.bottomOrderPriceRatio ?? null) != null) {
      newSettings.bottomOrderPriceRatio = Number(formValue.bracketsSettings!.bottomOrderPriceRatio);
    }

    if (formValue.showTradesPanel ?? false) {
      newSettings.tradesPanelSettings = {
        minTradeVolumeFilter: Number(formValue.tradesPanelSettings!.minTradeVolumeFilter),
        hideFilteredTrades: formValue.tradesPanelSettings?.hideFilteredTrades!,
        tradesAggregationPeriodMs: Number(formValue.tradesPanelSettings!.tradesAggregationPeriodMs),
        showOwnTrades: formValue.tradesPanelSettings?.showOwnTrades!,
      };
    }

    if ((formValue.workingVolumes?.length ?? 0) > 0) {
      newSettings.workingVolumes = formValue.workingVolumes!.map(wv => Number(wv));
    } else {
      newSettings.workingVolumes = [1];
    }

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && isInstrumentEqual(initialSettings, newSettings);

    const prevInstrumentLinkedSettings = initialSettings.instrumentLinkedSettings?.[ScalperOrderBookSettingsReadService.getObsoleteInstrumentKey(newSettings)];

    const newInstrumentLinkedSettings: InstrumentLinkedSettings = {
      ...prevInstrumentLinkedSettings,
      depth: newSettings.depth,
      showZeroVolumeItems: newSettings.showZeroVolumeItems!,
      showSpreadItems: newSettings.showSpreadItems!,
      volumeHighlightMode: newSettings.volumeHighlightMode,
      volumeHighlightOptions: newSettings.volumeHighlightOptions ?? prevInstrumentLinkedSettings?.volumeHighlightOptions ?? initialSettings.volumeHighlightOptions,
      volumeHighlightFullness: newSettings.volumeHighlightFullness ?? prevInstrumentLinkedSettings?.volumeHighlightFullness ?? initialSettings.volumeHighlightFullness,
      workingVolumes: newSettings.workingVolumes!,
      tradesClusterPanelSettings: initialSettings.tradesClusterPanelSettings,
      bracketsSettings: newSettings.bracketsSettings ?? prevInstrumentLinkedSettings?.bracketsSettings ?? initialSettings.bracketsSettings,
      tradesPanelSettings: newSettings.tradesPanelSettings ?? prevInstrumentLinkedSettings?.tradesPanelSettings ?? initialSettings.tradesPanelSettings,
      minorLinesStep: newSettings.minorLinesStep,
      majorLinesStep: newSettings.majorLinesStep,
      stopLimitOrdersDistance: newSettings.stopLimitOrdersDistance,
      layout: initialSettings.layout
    };

    return {
      instrumentLinkedSettings: newInstrumentLinkedSettings,
      widgetSettings: {
        ...newSettings,
        ...newInstrumentLinkedSettings
      }
    };
  }

  private initSettingsStream(): void {
    this.settings$ = this.settingsReadService.readSettings(this.guid).pipe(
      map(x => x.widgetSettings),
      shareReplay(1)
    );
  }

  private setCurrentFormValues(settings: ScalperOrderBookWidgetSettings): void {
    this.form.reset();

    this.form.controls.instrument.setValue({
      symbol: settings.symbol,
      exchange: settings.exchange,
      instrumentGroup: settings.instrumentGroup ?? null
    });
    this.form.controls.instrumentGroup.setValue(settings.instrumentGroup ?? null);

    this.form.controls.depth.setValue(settings.depth ?? 10);
    this.form.controls.showZeroVolumeItems.setValue(settings.showZeroVolumeItems);
    this.form.controls.showSpreadItems.setValue(settings.showSpreadItems);
    this.form.controls.showInstrumentPriceDayChange.setValue(settings.showInstrumentPriceDayChange ?? false);
    this.form.controls.showShortLongIndicators.setValue(settings.showShortLongIndicators ?? false);
    this.form.controls.shortLongIndicatorsPanelSlot.setValue(settings.shortLongIndicatorsPanelSlot ?? PanelSlots.BottomFloatingPanel);
    this.form.controls.shortLongIndicatorsUpdateIntervalSec.setValue(settings.shortLongIndicatorsUpdateIntervalSec ?? 60);
    this.form.controls.showLimitOrdersVolumeIndicators.setValue(settings.showLimitOrdersVolumeIndicators ?? false);
    this.form.controls.hideTooltips.setValue(settings.hideTooltips ?? false);

    this.form.controls.volumeDisplayFormat.setValue(settings.volumeDisplayFormat ?? NumberDisplayFormat.Default);

    this.form.controls.showRuler.setValue(settings.showRuler ?? false);
    this.form.controls.rulerSettings.setValue({
      markerDisplayFormat: settings.rulerSettings?.markerDisplayFormat ?? PriceUnits.Points
    });

    this.form.controls.enableAutoAlign.setValue(settings.enableAutoAlign ?? false);
    this.form.controls.autoAlignIntervalSec.setValue(settings.autoAlignIntervalSec ?? 15);

    this.form.controls.showPriceWithZeroPadding.setValue(settings.showPriceWithZeroPadding ?? false);

    this.form.controls.fontSize.setValue(settings.fontSize ?? 12);
    this.form.controls.rowHeight.setValue(settings.rowHeight ?? 18);
    this.form.controls.minorLinesStep.setValue(settings.minorLinesStep ?? ScalperOrderBookConstants.defaultMinorLinesStep);
    this.form.controls.majorLinesStep.setValue(settings.majorLinesStep ?? ScalperOrderBookConstants.defaultMajorLinesStep);

    this.form.controls.disableHotkeys.setValue(settings.disableHotkeys);
    this.form.controls.enableMouseClickSilentOrders.setValue(settings.enableMouseClickSilentOrders);
    this.form.controls.stopLimitOrdersDistance.setValue(settings.stopLimitOrdersDistance ?? 0);

    this.form.controls.showTradesPanel.setValue(settings.showTradesPanel ?? false);
    if (settings.tradesPanelSettings) {
      this.form.controls.tradesPanelSettings.setValue({
        minTradeVolumeFilter: settings.tradesPanelSettings.minTradeVolumeFilter,
        hideFilteredTrades: settings.tradesPanelSettings.hideFilteredTrades,
        tradesAggregationPeriodMs: settings.tradesPanelSettings.tradesAggregationPeriodMs,
        showOwnTrades: settings.tradesPanelSettings.showOwnTrades ?? false
      });
    }

    this.form.controls.showTradesClustersPanel.setValue(settings.showTradesClustersPanel ?? false);

    this.form.controls.showWorkingVolumesPanel.setValue(settings.showWorkingVolumesPanel ?? true);
    this.form.controls.workingVolumesPanelSlot.setValue(settings.workingVolumesPanelSlot ?? PanelSlots.BottomFloatingPanel);
    if (settings.workingVolumes.length > 0) {
      this.form.controls.workingVolumes.clear();
      settings.workingVolumes.forEach(volume => {
        this.form.controls.workingVolumes.push(this.createWorkingVolumeControl(volume));
      });
    }

    this.form.controls.volumeHighlightMode.setValue(settings.volumeHighlightMode ?? VolumeHighlightMode.Off);
    this.form.controls.volumeHighlightFullness.setValue(settings.volumeHighlightFullness ?? 1000);

    if (settings.volumeHighlightOptions.length > 0) {
      this.form.controls.volumeHighlightOptions.clear();

      [...settings.volumeHighlightOptions]
        .sort((a, b) => a.boundary - b.boundary)
        .forEach(option => {
          this.form.controls.volumeHighlightOptions.push(this.createVolumeHighlightOptionsControl(option));
        });
    }

    if (settings.bracketsSettings) {
      this.form.controls.bracketsSettings.setValue({
        orderPriceUnits: settings.bracketsSettings.orderPriceUnits ?? PriceUnits.Points,
        topOrderPriceRatio: settings.bracketsSettings.topOrderPriceRatio ?? null,
        bottomOrderPriceRatio: settings.bracketsSettings.bottomOrderPriceRatio ?? null,
        useBracketsWhenClosingPosition: settings.bracketsSettings.useBracketsWhenClosingPosition ?? false
      });
    }

    this.checkFieldsAvailability();
  }

  private initCheckFieldsAvailability(): void {
    this.form.valueChanges.pipe(
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.checkFieldsAvailability();
    });
  }

  private checkFieldsAvailability(): void {
    const formValue = this.form.value;
    if ((formValue?.showShortLongIndicators) ?? false) {
      this.form.controls.shortLongIndicatorsUpdateIntervalSec.enable();
    } else {
      this.form.controls.shortLongIndicatorsUpdateIntervalSec.disable();
    }

    if ((formValue?.showRuler) ?? false) {
      this.form.controls.rulerSettings.enable();
    } else {
      this.form.controls.rulerSettings.disable();
    }

    if ((formValue?.enableAutoAlign) ?? false) {
      this.form.controls.autoAlignIntervalSec.enable();
    } else {
      this.form.controls.autoAlignIntervalSec.disable();
    }

    if (formValue?.volumeHighlightMode === VolumeHighlightMode.VolumeBoundsWithFixedValue) {
      this.form.controls.volumeHighlightFullness.enable();
      this.form.controls.volumeHighlightOptions.enable();
    } else {
      this.form.controls.volumeHighlightFullness.disable();
      this.form.controls.volumeHighlightOptions.disable();
    }

    if ((formValue?.showTradesPanel) ?? false) {
      this.form.controls.tradesPanelSettings.enable();
    } else {
      this.form.controls.tradesPanelSettings.disable();
    }

    if ((formValue?.showWorkingVolumesPanel) ?? false) {
      this.form.controls.workingVolumes.enable();
    } else {
      this.form.controls.workingVolumes.disable();
    }
  }

  private createVolumeHighlightOptionsControl(option: VolumeHighlightOption): FormGroup<{
    boundary: FormControl<number>;
    color: FormControl<string>;
  }> {
    return this.formBuilder.nonNullable.group(
      {
        boundary: this.formBuilder.nonNullable.control(
          option.boundary,
          {
            validators: [
              Validators.required,
              Validators.min(this.validationOptions.volumeHighlightOption.boundary.min),
              Validators.max(this.validationOptions.volumeHighlightOption.boundary.max)
            ]
          }
        ),
        color: this.formBuilder.nonNullable.control(option.color, Validators.required)
      }
    );
  }

  private createWorkingVolumeControl(value: number): FormControl<number> {
    return this.formBuilder.nonNullable.control(
      value,
      [
        Validators.required,
        Validators.min(this.validationOptions.workingVolume.min),
        Validators.max(this.validationOptions.workingVolume.max)
      ]
    );
  }

  private getSettingsToCopy(initialSettings: ScalperOrderBookWidgetSettings): ScalperOrderBookWidgetSettings {
    return {
      ...initialSettings,
      ...this.getUpdatedSettings(initialSettings).widgetSettings
    };
  }
}
