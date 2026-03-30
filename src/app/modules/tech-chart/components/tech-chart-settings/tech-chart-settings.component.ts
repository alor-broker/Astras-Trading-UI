import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {Observable, take} from "rxjs";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {isInstrumentEqual} from '../../../../shared/utils/settings-helper';
import {InstrumentKey} from '../../../../shared/models/instruments/instrument-key.model';
import {LineMarkerPosition, TechChartSettings, TradeDisplayMarker} from '../../models/tech-chart-settings.model';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {
  WidgetSettingsBaseComponent
} from "../../../../shared/components/widget-settings/widget-settings-base.component";
import {SyntheticInstrumentsHelper} from "../../utils/synthetic-instruments.helper";
import {DeviceService} from "../../../../shared/services/device.service";
import {DeviceInfo} from "../../../../shared/models/device-info.model";
import {ThemeService} from "../../../../shared/services/theme.service";
import {map} from "rxjs/operators";
import {NzMarks, NzSliderComponent} from "ng-zorro-antd/slider";
import {WidgetSettingsComponent} from '../../../../shared/components/widget-settings/widget-settings.component';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzCollapseComponent, NzCollapsePanelComponent} from 'ng-zorro-antd/collapse';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {InstrumentSearchComponent} from '../../../../shared/components/instrument-search/instrument-search.component';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {
  InstrumentBoardSelectComponent
} from '../../../../shared/components/instrument-board-select/instrument-board-select.component';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzColorPickerComponent} from 'ng-zorro-antd/color-picker';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-tech-chart-settings',
  templateUrl: './tech-chart-settings.component.html',
  styleUrls: ['./tech-chart-settings.component.less'],
  imports: [
    WidgetSettingsComponent,
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
    InstrumentSearchComponent,
    NzInputDirective,
    InstrumentBoardSelectComponent,
    NzSwitchComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzIconDirective,
    NzSliderComponent,
    NzColorPickerComponent,
    NzTypographyComponent,
    AsyncPipe
  ]
})
export class TechChartSettingsComponent extends WidgetSettingsBaseComponent<TechChartSettings> implements OnInit {
  protected readonly settingsService: WidgetSettingsService;
  protected readonly manageDashboardsService: ManageDashboardsService;
  protected readonly destroyRef: DestroyRef;
  private readonly formBuilder = inject(FormBuilder);
  private readonly deviceService = inject(DeviceService);
  private readonly themeService = inject(ThemeService);

  readonly availableLineMarkerPositions = Object.values(LineMarkerPosition);
  readonly TradeDisplayMarkers = TradeDisplayMarker;

  readonly validationOptions = {
    markerSize: {
      min: 10,
      max: 50
    }
  };

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

  isSyntheticInstrument = SyntheticInstrumentsHelper.isSyntheticInstrument;
  deviceInfo$!: Observable<DeviceInfo>;
  protected settings$!: Observable<TechChartSettings>;

  constructor() {
    const settingsService = inject(WidgetSettingsService);
    const manageDashboardsService = inject(ManageDashboardsService);
    const destroyRef = inject(DestroyRef);

    super(settingsService, manageDashboardsService, destroyRef);

    this.settingsService = settingsService;
    this.manageDashboardsService = manageDashboardsService;
    this.destroyRef = destroyRef;
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form.valid;
  }

  ngOnInit(): void {
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

  protected getUpdatedSettings(initialSettings: TechChartSettings): Partial<TechChartSettings> {
    const formValue = this.form!.value as Partial<TechChartSettings & { instrument: InstrumentKey }>;
    const newSettings = {
      ...this.form!.value,
      symbol: formValue.instrument?.symbol,
      exchange: formValue.instrument?.exchange,
    } as TechChartSettings & { instrument?: InstrumentKey };

    delete newSettings.instrument;

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && isInstrumentEqual(initialSettings as InstrumentKey, newSettings as InstrumentKey);

    return newSettings;
  }

  protected setCurrentFormValues(settings: TechChartSettings): void {
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
