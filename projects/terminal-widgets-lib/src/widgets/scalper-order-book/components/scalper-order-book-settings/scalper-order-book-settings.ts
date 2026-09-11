import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';
import {WidgetSettingsSwitch} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-switch/widget-settings-switch';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {ScalperWorkingVolumesEditor} from '../scalper-working-volumes-editor/scalper-working-volumes-editor';
import {ScalperVolumeHighlightEditor} from '../scalper-volume-highlight-editor/scalper-volume-highlight-editor';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
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
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
  NzMarks,
  NzSliderComponent
} from "ng-zorro-antd/slider";
import {ScalperOrderBookConstants} from "../../constants/scalper-order-book.constants";
import {ScalperOrderBookSettingsReadService} from "../../services/scalper-order-book-settings-read.service";
import {ScalperOrderBookSettingsWriteService} from "../../services/scalper-order-book-settings-write.service";
import {map} from "rxjs/operators";
import {TradesClusterPanelSettingsDefaults} from "./constants/settings-defaults";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {
  NzRadioComponent,
  NzRadioGroupComponent
} from 'ng-zorro-antd/radio';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {
  InstrumentLinkedSettings,
  PanelSlots,
  PriceUnits,
  ScalperOrderBookWidgetSettings,
  TradesClusterHighlightMode,
  VolumeHighlightMode,
  VolumeHighlightOption
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {InputNumberValidation} from "@terminal-core-lib/common/constants/validation.constants";
import {NumberDisplayFormat} from "@terminal-core-lib/common/types/number-display-format.types";
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {InstrumentEqualityComparer, InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {InstrumentBoardSelect} from '@terminal-core-lib/features/instruments/components/instrument-board-select/instrument-board-select';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';

@Component({
  selector: 'ats-scalper-order-book-settings',
  templateUrl: './scalper-order-book-settings.html',
  styleUrls: ['./scalper-order-book-settings.less'],
  imports: [
    WidgetSettingsEditor,
    WidgetSettingsGroup,
    WidgetSettingsForm,
    WidgetSettingsFormItem,
    WidgetSettingsSwitch,
    ScalperWorkingVolumesEditor,
    ScalperVolumeHighlightEditor,
    TranslocoDirective,
    ReactiveFormsModule,
    NzInputDirective,
    NzSliderComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzRadioGroupComponent,
    NzRadioComponent,
    NzTypographyComponent,
    InstrumentBoardSelect,
    InlineInstrumentSearch,
    InputNumber
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ScalperOrderBookSettings extends WidgetSettingsBase<ScalperOrderBookWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly volumeHighlightModes = VolumeHighlightMode;

  readonly validationOptions = {
    depth: {
      min: 1,
      max: 50
    },
    workingVolume: {
      min: 1,
      max: InputNumberValidation.max
    },
    volumeHighlightOption: {
      boundary: {
        min: 1,
        max: InputNumberValidation.max
      },
      volumeHighlightFullness: {
        min: 1,
        max: InputNumberValidation.max
      }
    },
    autoAlignIntervalSec: {
      min: 0.1,
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
      max: InputNumberValidation.max
    },
    majorLinesStep: {
      min: 1,
      max: InputNumberValidation.max
    },
    bracket: {
      triggerPrice: {
        min: 0.01,
        max: InputNumberValidation.max,
        percentsStep: 0.01,
        stepsStep: 1
      },
      limitPrice: {
        min: 0,
        max: InputNumberValidation.max,
        percentsStep: 0.01,
        stepsStep: 1
      }
    },
    tradesPanelSettings: {
      minTradeVolumeFilter: {
        min: 0,
        max: InputNumberValidation.max
      },
      tradesAggregationPeriodMs: {
        min: 0,
        max: 60 * 60 * 1000
      }
    },
    tradesClusterPanelSettings: {
      targetVolume: {
        min: 1,
        max: InputNumberValidation.max
      }
    },
    stopLimitOrdersDistance: {
      min: 0,
      max: 100
    }
  };

  readonly availableNumberFormats = Object.values(NumberDisplayFormat);

  readonly availableTradesClusterHighlightModes = Object.values(TradesClusterHighlightMode);

  readonly workingVolumesPanelSlots = [PanelSlots.BottomFloatingPanel, PanelSlots.TopPanel];

  readonly shortLongPanelSlots = [PanelSlots.BottomFloatingPanel, PanelSlots.TopPanel];

  readonly orderPriceUnits = PriceUnits;

  readonly availableVolumeHighlightModes: string[] = [
    VolumeHighlightMode.Off,
    VolumeHighlightMode.BiggestVolume,
    VolumeHighlightMode.VolumeBoundsWithFixedValue,
  ];

  protected settings$!: Observable<ScalperOrderBookWidgetSettings>;

  private readonly settingsReadService = inject(ScalperOrderBookSettingsReadService);

  private readonly settingsWriteService = inject(ScalperOrderBookSettingsWriteService);

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.group({
      instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
      instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null)
    }),
    display: this.formBuilder.group({
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
        5,
        [
          Validators.required,
          Validators.min(this.validationOptions.autoAlignIntervalSec.min),
          Validators.max(this.validationOptions.autoAlignIntervalSec.max)
        ]
      ),
      showPriceWithZeroPadding: this.formBuilder.nonNullable.control(false),
      hideTooltips: this.formBuilder.nonNullable.control(false)
    }),
    table: this.formBuilder.group({
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
      )
    }),
    orders: this.formBuilder.group({
      disableHotkeys: this.formBuilder.nonNullable.control(true),
      enableMouseClickSilentOrders: this.formBuilder.nonNullable.control(false),
      allowMargin: this.formBuilder.nonNullable.control<boolean | null>(null),
      stopLimitOrdersDistance: this.formBuilder.nonNullable.control(
        0,
        [
          Validators.min(this.validationOptions.stopLimitOrdersDistance.min),
          Validators.max(this.validationOptions.stopLimitOrdersDistance.max)
        ]
      )
    }),
    panels: this.formBuilder.group({
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
      showInstrumentPriceDayChange: this.formBuilder.nonNullable.control(true),
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
      showTradesClustersPanel: this.formBuilder.nonNullable.control(false),
      tradesClusterPanelSettings: this.formBuilder.group(
        {
          highlightMode: this.formBuilder.nonNullable.control(TradesClusterHighlightMode.Off),
          targetVolume: this.formBuilder.nonNullable.control(
            10000,
            [
              Validators.required,
              Validators.min(this.validationOptions.tradesClusterPanelSettings.targetVolume.min),
              Validators.max(this.validationOptions.tradesClusterPanelSettings.targetVolume.max)
            ]
          ),
        }
      )
    }),
    volumes: this.formBuilder.group({
      showWorkingVolumesPanel: this.formBuilder.nonNullable.control(true),
      workingVolumesPanelSlot: this.formBuilder.nonNullable.control(PanelSlots.BottomFloatingPanel),
      workingVolumes: this.formBuilder.nonNullable.array(
        [this.createWorkingVolumeControl(1)],
        Validators.minLength(1)
      )
    }),
    highlight: this.formBuilder.group({
      volumeHighlightMode: this.formBuilder.nonNullable.control(VolumeHighlightMode.Off),
      volumeHighlightFullness: this.formBuilder.nonNullable.control(
        10000,
        [
          Validators.required,
          Validators.min(this.validationOptions.volumeHighlightOption.volumeHighlightFullness.min),
          Validators.max(this.validationOptions.volumeHighlightOption.volumeHighlightFullness.max)
        ]
      ),
      volumeHighlightOptions: this.formBuilder.nonNullable.array(
        [this.createVolumeHighlightOptionsControl({boundary: 1, color: 'red'})],
        Validators.minLength(1)
      )
    }),
    automation: this.formBuilder.group({
      bracketsSettings: this.formBuilder.group({
          orderPriceUnits: this.formBuilder.nonNullable.control(PriceUnits.Points),
          topOrderPriceRatio: this.formBuilder.control<number | null>(
            null,
            [
              Validators.min(this.validationOptions.bracket.triggerPrice.min),
              Validators.max(this.validationOptions.bracket.triggerPrice.max)
            ]
          ),
          topOrderPriceGapRatio: this.formBuilder.control<number>(
            0,
            [
              Validators.min(this.validationOptions.bracket.limitPrice.min),
              Validators.max(this.validationOptions.bracket.limitPrice.max)
            ]
          ),
          bottomOrderPriceRatio: this.formBuilder.control<number | null>(
            null,
            [
              Validators.min(this.validationOptions.bracket.triggerPrice.min),
              Validators.max(this.validationOptions.bracket.triggerPrice.max)
            ]
          ),
          bottomOrderPriceGapRatio: this.formBuilder.control<number>(
            0,
            [
              Validators.min(this.validationOptions.bracket.limitPrice.min),
              Validators.max(this.validationOptions.bracket.limitPrice.max)
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
    })
  });

  override get canSave(): boolean {
    return this.form?.valid ?? false;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.initCheckFieldsAvailability();
  }

  addVolumeHighlightOption(): void {
    const defaultValue = {
      boundary: 1,
      color: 'red',
      ...this.form.controls.highlight.value.volumeHighlightOptions![this.form.controls.highlight.value.volumeHighlightOptions!.length - 1],
    };

    this.form.controls.highlight.controls.volumeHighlightOptions.push(this.createVolumeHighlightOptionsControl(defaultValue));
  }

  removeVolumeHighlightOption(index: number): void {
    this.form.controls.highlight.controls.volumeHighlightOptions.removeAt(index);
  }

  showVolumeHighlightOptions(): boolean {
    return this.form.controls.highlight.value.volumeHighlightMode === VolumeHighlightMode.VolumeBoundsWithFixedValue;
  }

  showRulerOptions(): boolean {
    return this.form.controls.display.value.showRuler === true;
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form.controls.instrument.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  removeWorkingVolume(index: number): void {
    this.form.controls.volumes.controls.workingVolumes.removeAt(index);
  }

  addWorkingVolume(): void {
    const workingVolumeControl = this.form.controls.volumes.controls.workingVolumes;
    const defaultValue = workingVolumeControl.controls[workingVolumeControl.length - 1]?.value as number | undefined;
    workingVolumeControl.push(this.createWorkingVolumeControl((defaultValue ?? 0) ? defaultValue! * 10 : 1));
  }

  getSliderMarks(minValue: number, maxValue: number): NzMarks {
    return {
      [minValue]: minValue.toString(),
      [maxValue]: maxValue.toString(),
    };
  }

  override updateSettings(): void {
    if (!this.canSave) {
      return;
    }

    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      const updatedSettings = this.getSettingsUpdates(initialSettings);
      const instrumentKey = InstrumentKeyHelper.toInstrumentKey({
        symbol: updatedSettings.widgetSettings.symbol!,
        exchange: updatedSettings.widgetSettings.exchange!,
        instrumentGroup: updatedSettings.widgetSettings.instrumentGroup
      });

      this.settingsWriteService.updateInstrumentLinkedSettings(updatedSettings.instrumentLinkedSettings, instrumentKey);
      this.settingsWriteService.updateWidgetSettings(updatedSettings.widgetSettings, this.guid());

      this.settingsChange.emit();
      this.closeRequested.emit();
    });
  }

  private getSettingsUpdates(initialSettings: ScalperOrderBookWidgetSettings): {
    instrumentLinkedSettings: Partial<InstrumentLinkedSettings>;
    widgetSettings: Partial<ScalperOrderBookWidgetSettings>;
  } {
    const formValue = {
      ...this.form.controls.instrument.value,
      ...this.form.controls.display.value,
      ...this.form.controls.table.value,
      ...this.form.controls.orders.value,
      ...this.form.controls.panels.value,
      ...this.form.controls.volumes.value,
      ...this.form.controls.highlight.value,
      ...this.form.controls.automation.value
    };

    const newSettings = {
      ...formValue,
      symbol: formValue.instrument!.symbol,
      exchange: formValue.instrument!.exchange,
      depth: Number(formValue.depth),
      fontSize: Number(formValue.fontSize),
      rowHeight: Number(formValue.rowHeight),
      stopLimitOrdersDistance: Number(formValue.stopLimitOrdersDistance),
      minorLinesStep: Number(formValue.minorLinesStep),
      majorLinesStep: Number(formValue.majorLinesStep),
    } as Partial<ScalperOrderBookWidgetSettings> & InstrumentKey & { instrument?: InstrumentKey };

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

    if (formValue.showTradesPanel ?? false) {
      newSettings.tradesPanelSettings = {
        minTradeVolumeFilter: Number(formValue.tradesPanelSettings!.minTradeVolumeFilter),
        hideFilteredTrades: formValue.tradesPanelSettings?.hideFilteredTrades ?? false,
        tradesAggregationPeriodMs: Number(formValue.tradesPanelSettings!.tradesAggregationPeriodMs),
        showOwnTrades: formValue.tradesPanelSettings?.showOwnTrades ?? false,
      };
    }

    if ((formValue.workingVolumes?.length ?? 0) > 0) {
      newSettings.workingVolumes = formValue.workingVolumes!.map(wv => Number(wv));
    } else {
      newSettings.workingVolumes = [1];
    }

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && InstrumentEqualityComparer.equals(initialSettings, newSettings);

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
      tradesClusterPanelSettings: {
        ...TradesClusterPanelSettingsDefaults,
        ...initialSettings.tradesClusterPanelSettings,
        highlightMode: newSettings.tradesClusterPanelSettings?.highlightMode ?? TradesClusterHighlightMode.Off,
        targetVolume: Number(newSettings.tradesClusterPanelSettings?.targetVolume ?? 10000)
      },
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

  protected override initSettingsStream(): void {
    this.settings$ = this.settingsReadService.readSettings(this.guid()).pipe(
      map(x => x.widgetSettings),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  protected override setCurrentFormValues(settings: ScalperOrderBookWidgetSettings): void {
    this.form.reset();

    this.form.controls.instrument.controls.instrument.setValue({
      symbol: settings.symbol,
      exchange: settings.exchange,
      instrumentGroup: settings.instrumentGroup ?? null
    });
    this.form.controls.instrument.controls.instrumentGroup.setValue(settings.instrumentGroup ?? null);

    this.form.controls.display.controls.depth.setValue(settings.depth ?? 10);
    this.form.controls.display.controls.showZeroVolumeItems.setValue(settings.showZeroVolumeItems);
    this.form.controls.display.controls.showSpreadItems.setValue(settings.showSpreadItems);
    this.form.controls.panels.controls.showInstrumentPriceDayChange.setValue(settings.showInstrumentPriceDayChange ?? false);
    this.form.controls.panels.controls.showShortLongIndicators.setValue(settings.showShortLongIndicators ?? false);
    this.form.controls.panels.controls.shortLongIndicatorsPanelSlot.setValue(settings.shortLongIndicatorsPanelSlot ?? PanelSlots.BottomFloatingPanel);
    this.form.controls.panels.controls.shortLongIndicatorsUpdateIntervalSec.setValue(settings.shortLongIndicatorsUpdateIntervalSec ?? 60);
    this.form.controls.display.controls.showLimitOrdersVolumeIndicators.setValue(settings.showLimitOrdersVolumeIndicators ?? false);
    this.form.controls.display.controls.hideTooltips.setValue(settings.hideTooltips ?? false);

    this.form.controls.display.controls.volumeDisplayFormat.setValue(settings.volumeDisplayFormat ?? NumberDisplayFormat.Default);

    this.form.controls.display.controls.showRuler.setValue(settings.showRuler ?? false);
    this.form.controls.display.controls.rulerSettings.setValue({
      markerDisplayFormat: settings.rulerSettings?.markerDisplayFormat ?? PriceUnits.Points
    });

    this.form.controls.display.controls.enableAutoAlign.setValue(settings.enableAutoAlign ?? false);
    this.form.controls.display.controls.autoAlignIntervalSec.setValue(settings.autoAlignIntervalSec ?? 5);

    this.form.controls.display.controls.showPriceWithZeroPadding.setValue(settings.showPriceWithZeroPadding ?? false);

    this.form.controls.table.controls.fontSize.setValue(settings.fontSize ?? 12);
    this.form.controls.table.controls.rowHeight.setValue(settings.rowHeight ?? 18);
    this.form.controls.table.controls.minorLinesStep.setValue(settings.minorLinesStep ?? ScalperOrderBookConstants.defaultMinorLinesStep);
    this.form.controls.table.controls.majorLinesStep.setValue(settings.majorLinesStep ?? ScalperOrderBookConstants.defaultMajorLinesStep);

    this.form.controls.orders.controls.disableHotkeys.setValue(settings.disableHotkeys);
    this.form.controls.orders.controls.enableMouseClickSilentOrders.setValue(settings.enableMouseClickSilentOrders);
    this.form.controls.orders.controls.stopLimitOrdersDistance.setValue(settings.stopLimitOrdersDistance ?? 0);
    this.form.controls.orders.controls.allowMargin.setValue(settings.allowMargin ?? null);

    this.form.controls.panels.controls.showTradesPanel.setValue(settings.showTradesPanel ?? false);
    if (settings.tradesPanelSettings) {
      this.form.controls.panels.controls.tradesPanelSettings.setValue({
        minTradeVolumeFilter: settings.tradesPanelSettings.minTradeVolumeFilter,
        hideFilteredTrades: settings.tradesPanelSettings.hideFilteredTrades,
        tradesAggregationPeriodMs: settings.tradesPanelSettings.tradesAggregationPeriodMs,
        showOwnTrades: settings.tradesPanelSettings.showOwnTrades ?? false
      });
    }

    this.form.controls.panels.controls.showTradesClustersPanel.setValue(settings.showTradesClustersPanel ?? false);
    this.form.controls.panels.controls.tradesClusterPanelSettings.setValue({
      highlightMode: settings.tradesClusterPanelSettings?.highlightMode ?? TradesClusterHighlightMode.Off,
      targetVolume: settings.tradesClusterPanelSettings?.targetVolume ?? 10000,
    });

    this.form.controls.volumes.controls.showWorkingVolumesPanel.setValue(settings.showWorkingVolumesPanel ?? true);
    this.form.controls.volumes.controls.workingVolumesPanelSlot.setValue(settings.workingVolumesPanelSlot ?? PanelSlots.BottomFloatingPanel);
    if (settings.workingVolumes.length > 0) {
      this.form.controls.volumes.controls.workingVolumes.clear();
      settings.workingVolumes.forEach(volume => {
        this.form.controls.volumes.controls.workingVolumes.push(this.createWorkingVolumeControl(volume));
      });
    }

    this.form.controls.highlight.controls.volumeHighlightMode.setValue(settings.volumeHighlightMode ?? VolumeHighlightMode.Off);
    this.form.controls.highlight.controls.volumeHighlightFullness.setValue(settings.volumeHighlightFullness ?? 10000);

    if (settings.volumeHighlightOptions.length > 0) {
      this.form.controls.highlight.controls.volumeHighlightOptions.clear();

      [...settings.volumeHighlightOptions]
        .sort((a, b) => a.boundary - b.boundary)
        .forEach(option => {
          this.form.controls.highlight.controls.volumeHighlightOptions.push(this.createVolumeHighlightOptionsControl(option));
        });
    }

    if (settings.bracketsSettings) {
      this.form.controls.automation.controls.bracketsSettings.setValue({
        orderPriceUnits: settings.bracketsSettings.orderPriceUnits ?? PriceUnits.Points,
        topOrderPriceRatio: settings.bracketsSettings.topOrderPriceRatio ?? null,
        topOrderPriceGapRatio: settings.bracketsSettings.topOrderPriceGapRatio ?? 0,
        bottomOrderPriceRatio: settings.bracketsSettings.bottomOrderPriceRatio ?? null,
        bottomOrderPriceGapRatio: settings.bracketsSettings.bottomOrderPriceGapRatio ?? 0,
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
    if ((this.form.controls.panels.value?.showShortLongIndicators) ?? false) {
      this.form.controls.panels.controls.shortLongIndicatorsUpdateIntervalSec.enable({emitEvent: false});
    } else {
      this.form.controls.panels.controls.shortLongIndicatorsUpdateIntervalSec.disable({emitEvent: false});
    }

    if ((this.form.controls.display.value?.showRuler) ?? false) {
      this.form.controls.display.controls.rulerSettings.enable({emitEvent: false});
    } else {
      this.form.controls.display.controls.rulerSettings.disable({emitEvent: false});
    }

    if ((this.form.controls.display.value?.enableAutoAlign) ?? false) {
      this.form.controls.display.controls.autoAlignIntervalSec.enable({emitEvent: false});
    } else {
      this.form.controls.display.controls.autoAlignIntervalSec.disable({emitEvent: false});
    }

    if (this.form.controls.highlight.value?.volumeHighlightMode === VolumeHighlightMode.VolumeBoundsWithFixedValue) {
      this.form.controls.highlight.controls.volumeHighlightFullness.enable({emitEvent: false});
      this.form.controls.highlight.controls.volumeHighlightOptions.enable({emitEvent: false});
    } else {
      this.form.controls.highlight.controls.volumeHighlightFullness.disable({emitEvent: false});
      this.form.controls.highlight.controls.volumeHighlightOptions.disable({emitEvent: false});
    }

    if ((this.form.controls.panels.value?.showTradesPanel) ?? false) {
      this.form.controls.panels.controls.tradesPanelSettings.enable({emitEvent: false});
    } else {
      this.form.controls.panels.controls.tradesPanelSettings.disable({emitEvent: false});
    }

    if ((this.form.controls.panels.value?.showTradesClustersPanel) ?? false) {
      this.form.controls.panels.controls.tradesClusterPanelSettings.enable({emitEvent: false});
    } else {
      this.form.controls.panels.controls.tradesClusterPanelSettings.disable({emitEvent: false});
    }

    if (this.form.controls.panels.controls.tradesClusterPanelSettings.enabled) {
      if (this.form.controls.panels.value?.tradesClusterPanelSettings?.highlightMode === TradesClusterHighlightMode.TargetVolume) {
        this.form.controls.panels.controls.tradesClusterPanelSettings.controls.targetVolume.enable({emitEvent: false});
      } else {
        this.form.controls.panels.controls.tradesClusterPanelSettings.controls.targetVolume.disable({emitEvent: false});
      }
    }

    if ((this.form.controls.volumes.value?.showWorkingVolumesPanel) ?? false) {
      this.form.controls.volumes.controls.workingVolumes.enable({emitEvent: false});
    } else {
      this.form.controls.volumes.controls.workingVolumes.disable({emitEvent: false});
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

  protected override getUpdatedSettings(initialSettings: ScalperOrderBookWidgetSettings): Partial<ScalperOrderBookWidgetSettings> {
    return this.getSettingsUpdates(initialSettings).widgetSettings;
  }
}
