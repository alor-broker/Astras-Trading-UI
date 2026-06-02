import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
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
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
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
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from 'ng-zorro-antd/collapse';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
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
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {ThemeService} from '@terminal-core-lib/features/themes/services/theme.service';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {SyntheticInstrumentsHelper} from '@terminal-widgets-lib/widgets/tech-chart/utils/synthetic-instruments.helper';
import {DeviceInfo} from '@terminal-core-lib/common/services/device-service-types';
import {InstrumentEqualityComparer} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {InstrumentBoardSelect} from '@terminal-core-lib/features/instruments/components/instrument-board-select/instrument-board-select';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';

@Component({
  selector: 'ats-tech-chart-settings',
  templateUrl: './tech-chart-settings.html',
  styleUrls: ['./tech-chart-settings.less'],
  imports: [
    WidgetSettings,
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
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
export class TechChartSettings extends WidgetSettingsBase<TechChartWidgetSettings> implements OnInit {
  readonly availableLineMarkerPositions = Object.values(LineMarkerPosition);

  readonly TradeDisplayMarkers = TradeDisplayMarker;

  readonly validationOptions = {
    markerSize: {
      min: 10,
      max: 50
    }
  };

  isSyntheticInstrument = SyntheticInstrumentsHelper.isSyntheticInstrument;

  deviceInfo$!: Observable<DeviceInfo>;

  protected settings$!: Observable<TechChartWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    // instrument
    instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
    instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
    // view
    showTrades: this.formBuilder.nonNullable.control(false),
    showOrders: this.formBuilder.nonNullable.control(true),
    ordersLineMarkerPosition: this.formBuilder.nonNullable.control(LineMarkerPosition.Right),
    showPosition: this.formBuilder.nonNullable.control(true),
    positionLineMarkerPosition: this.formBuilder.nonNullable.control(LineMarkerPosition.Right),
    panels: this.formBuilder.group({
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
    trades: this.formBuilder.group({
      marker: this.formBuilder.nonNullable.control(TradeDisplayMarker.Note),
      markerSize: this.formBuilder.nonNullable.control(20, Validators.required),
      buyTradeColor: this.formBuilder.nonNullable.control('', Validators.required),
      sellTradeColor: this.formBuilder.nonNullable.control('', Validators.required),
    }),
    allowCustomTimeframes: this.formBuilder.nonNullable.control(false),
    orders: this.formBuilder.group({
      editWithoutConfirmation: this.formBuilder.nonNullable.control(false),
    })
  });

  private readonly deviceService = inject(DeviceService);

  private readonly themeService = inject(ThemeService);

  override get canSave(): boolean {
    return this.form.valid;
  }

  override ngOnInit(): void {
    this.initSettingsStream();

    this.deviceInfo$ = this.deviceService.deviceInfo$
      .pipe(
        take(1)
      );

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.setCurrentFormValues(settings);
    });
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form!.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  getSliderMarks(minValue: number, maxValue: number): NzMarks {
    return {
      [minValue]: minValue.toString(),
      [maxValue]: maxValue.toString(),
    };
  }

  protected getUpdatedSettings(initialSettings: TechChartWidgetSettings): Partial<TechChartWidgetSettings> {
    const formValue = this.form!.value as Partial<TechChartSettings & { instrument: InstrumentKey }>;
    const newSettings = {
      ...this.form!.value,
      symbol: formValue.instrument?.symbol,
      exchange: formValue.instrument?.exchange,
    } as TechChartWidgetSettings & { instrument?: InstrumentKey };

    delete newSettings.instrument;

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && InstrumentEqualityComparer.equals(initialSettings as InstrumentKey, newSettings as InstrumentKey);

    return newSettings;
  }

  protected setCurrentFormValues(settings: TechChartWidgetSettings): void {
    this.themeService.getThemeSettings().pipe(
      map(s => s.themeColors),
      take(1)
    ).subscribe(colors => {
      this.form.reset();

      this.form.controls.instrument.setValue({
        symbol: settings.symbol,
        exchange: settings.exchange ?? '',
        instrumentGroup: settings.instrumentGroup ?? null
      });
      this.form.controls.instrumentGroup.setValue(settings.instrumentGroup ?? null);

      this.form.controls.showTrades.setValue(settings.showTrades ?? false);
      this.form.controls.showOrders.setValue(settings.showOrders ?? true);
      this.form.controls.ordersLineMarkerPosition.setValue(settings.ordersLineMarkerPosition ?? LineMarkerPosition.Right);
      this.form.controls.showPosition.setValue(settings.showPosition ?? true);
      this.form.controls.positionLineMarkerPosition.setValue(settings.positionLineMarkerPosition ?? LineMarkerPosition.Right);

      this.form.controls.panels.setValue({
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

      this.form.controls.trades.setValue({
        marker: settings.trades?.marker ?? TradeDisplayMarker.Note,
        buyTradeColor: settings.trades?.buyTradeColor ?? colors.buyColorAccent,
        sellTradeColor: settings.trades?.sellTradeColor ?? colors.sellColorAccent,
        markerSize: settings.trades?.markerSize ?? 20
      });

      this.form.controls.orders.setValue({
        editWithoutConfirmation: settings.orders?.editWithoutConfirmation ?? false
      });

      this.form.controls.allowCustomTimeframes.setValue(settings.allowCustomTimeframes ?? false);
    });
  }
}
