import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {
  Observable,
  take
} from "rxjs";
import {map} from "rxjs/operators";
import {
  NzMarks,
  NzSliderComponent
} from "ng-zorro-antd/slider";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent
} from 'ng-zorro-antd/form';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzColorPickerComponent} from 'ng-zorro-antd/color-picker';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {AsyncPipe} from '@angular/common';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {
  LineMarkerPosition,
  TechChartWidgetSettings,
  TradeDisplayMarker
} from '@terminal-widgets-lib/widgets/tech-chart/widget-settings.types';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';
import {SettingsDeviceVisible} from '@terminal-widgets-lib/common/features/settings-editor/directives/widget-settings-device-visible.directive';
import {SettingsDeviceVisibility} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-visibility.types';
import {ThemeService} from '@terminal-core-lib/features/themes/services/theme.service';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {SyntheticInstrumentsHelper} from '@terminal-widgets-lib/widgets/tech-chart/utils/synthetic-instruments.helper';
import {InstrumentEqualityComparer} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {InstrumentBoardSelect} from '@terminal-core-lib/features/instruments/components/instrument-board-select/instrument-board-select';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';

@Component({
  selector: 'ats-tech-chart-settings',
  templateUrl: './tech-chart-settings.html',
  imports: [
    WidgetSettingsEditor,
    WidgetSettingsGroup,
    SettingsDeviceVisible,
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzInputDirective,
    NzSwitchComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzIconDirective,
    NzSliderComponent,
    NzColorPickerComponent,
    NzTypographyComponent,
    AsyncPipe,
    InstrumentBoardSelect,
    InlineInstrumentSearch
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TechChartSettings extends WidgetSettingsBase<TechChartWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly availableLineMarkerPositions = Object.values(LineMarkerPosition);

  readonly TradeDisplayMarkers = TradeDisplayMarker;

  readonly DeviceVisibility = SettingsDeviceVisibility;

  readonly validationOptions = {
    markerSize: {
      min: 10,
      max: 50
    }
  };

  isSyntheticInstrument = SyntheticInstrumentsHelper.isSyntheticInstrument;

  protected settings$!: Observable<TechChartWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  // Form is organized into the same groups as the UI, so a group's validity is
  // simply `form.controls.<group>.valid` — no per-control checks needed.
  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.group({
      instrumentKey: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
      instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
    }),
    portfolioIndicators: this.formBuilder.group({
      showOrders: this.formBuilder.nonNullable.control(true),
      ordersLineMarkerPosition: this.formBuilder.nonNullable.control(LineMarkerPosition.Right),
      showPosition: this.formBuilder.nonNullable.control(true),
      positionLineMarkerPosition: this.formBuilder.nonNullable.control(LineMarkerPosition.Right),
      showTrades: this.formBuilder.nonNullable.control(false),
      trades: this.formBuilder.group({
        marker: this.formBuilder.nonNullable.control(TradeDisplayMarker.Note),
        markerSize: this.formBuilder.nonNullable.control(20, Validators.required),
        buyTradeColor: this.formBuilder.nonNullable.control('', Validators.required),
        sellTradeColor: this.formBuilder.nonNullable.control('', Validators.required),
      }),
    }),
    chartElements: this.formBuilder.group({
      header: this.formBuilder.nonNullable.control(true),
      headerSymbolSearch: this.formBuilder.nonNullable.control(true),
      headerChartType: this.formBuilder.nonNullable.control(true),
      headerCompare: this.formBuilder.nonNullable.control(true),
      headerResolutions: this.formBuilder.nonNullable.control(true),
      headerIndicators: this.formBuilder.nonNullable.control(true),
      headerScreenshot: this.formBuilder.nonNullable.control(true),
      headerSettings: this.formBuilder.nonNullable.control(true),
      headerUndoRedo: this.formBuilder.nonNullable.control(true),
      headerFullscreenButton: this.formBuilder.nonNullable.control(true),
      drawingsToolbar: this.formBuilder.nonNullable.control(true),
      timeframesBottomToolbar: this.formBuilder.nonNullable.control(true),
    }),
    orderManagement: this.formBuilder.group({
      editWithoutConfirmation: this.formBuilder.nonNullable.control(false),
    }),
    other: this.formBuilder.group({
      allowCustomTimeframes: this.formBuilder.nonNullable.control(false),
    })
  });

  private readonly themeService = inject(ThemeService);

  override get canSave(): boolean {
    return this.form.valid;
  }

  protected get instrument(): InstrumentKey | null {
    return this.form.controls.instrument.controls.instrumentKey.value;
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form.controls.instrument.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  getSliderMarks(minValue: number, maxValue: number): NzMarks {
    return {
      [minValue]: minValue.toString(),
      [maxValue]: maxValue.toString(),
    };
  }

  protected getUpdatedSettings(initialSettings: TechChartWidgetSettings): Partial<TechChartWidgetSettings> {
    const value = this.form.getRawValue();
    const instrument = value.instrument.instrumentKey;

    const newSettings: Partial<TechChartWidgetSettings> = {
      symbol: instrument?.symbol ?? '',
      exchange: instrument?.exchange ?? '',
      instrumentGroup: value.instrument.instrumentGroup,
      showOrders: value.portfolioIndicators.showOrders,
      ordersLineMarkerPosition: value.portfolioIndicators.ordersLineMarkerPosition,
      showPosition: value.portfolioIndicators.showPosition,
      positionLineMarkerPosition: value.portfolioIndicators.positionLineMarkerPosition,
      showTrades: value.portfolioIndicators.showTrades,
      trades: value.portfolioIndicators.trades,
      panels: value.chartElements,
      orders: value.orderManagement,
      allowCustomTimeframes: value.other.allowCustomTimeframes
    };

    newSettings.linkToActive = (initialSettings.linkToActive ?? false)
      && InstrumentEqualityComparer.equals(initialSettings as InstrumentKey, newSettings as InstrumentKey);

    return newSettings;
  }

  protected setCurrentFormValues(settings: TechChartWidgetSettings): void {
    this.themeService.getThemeSettings().pipe(
      map(s => s.themeColors),
      take(1)
    ).subscribe(colors => {
      this.form.reset();

      this.form.controls.instrument.setValue({
        instrumentKey: {
          symbol: settings.symbol,
          exchange: settings.exchange ?? '',
          instrumentGroup: settings.instrumentGroup ?? null
        },
        instrumentGroup: settings.instrumentGroup ?? null
      });

      this.form.controls.portfolioIndicators.setValue({
        showOrders: settings.showOrders ?? true,
        ordersLineMarkerPosition: settings.ordersLineMarkerPosition ?? LineMarkerPosition.Right,
        showPosition: settings.showPosition ?? true,
        positionLineMarkerPosition: settings.positionLineMarkerPosition ?? LineMarkerPosition.Right,
        showTrades: settings.showTrades ?? false,
        trades: {
          marker: settings.trades?.marker ?? TradeDisplayMarker.Note,
          markerSize: settings.trades?.markerSize ?? 20,
          buyTradeColor: settings.trades?.buyTradeColor ?? colors.buyColorAccent,
          sellTradeColor: settings.trades?.sellTradeColor ?? colors.sellColorAccent
        }
      });

      this.form.controls.chartElements.setValue({
        header: settings.panels?.header ?? true,
        headerSymbolSearch: settings.panels?.headerSymbolSearch ?? true,
        headerCompare: settings.panels?.headerCompare ?? true,
        headerResolutions: settings.panels?.headerResolutions ?? true,
        headerChartType: settings.panels?.headerChartType ?? true,
        headerIndicators: settings.panels?.headerIndicators ?? true,
        headerScreenshot: settings.panels?.headerScreenshot ?? true,
        headerSettings: settings.panels?.headerSettings ?? true,
        headerUndoRedo: settings.panels?.headerUndoRedo ?? true,
        headerFullscreenButton: settings.panels?.headerFullscreenButton ?? true,
        drawingsToolbar: settings.panels?.drawingsToolbar ?? true,
        timeframesBottomToolbar: settings.panels?.timeframesBottomToolbar ?? true,
      });

      this.form.controls.orderManagement.setValue({
        editWithoutConfirmation: settings.orders?.editWithoutConfirmation ?? false
      });

      this.form.controls.other.setValue({
        allowCustomTimeframes: settings.allowCustomTimeframes ?? false
      });
    });
  }
}
