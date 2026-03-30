import { Component, DestroyRef, OnInit, output, inject } from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Observable, take} from "rxjs";
import {isInstrumentEqual} from '../../../../shared/utils/settings-helper';
import {InstrumentKey} from '../../../../shared/models/instruments/instrument-key.model';
import {ColumnsOrder, OrderbookSettings} from '../../models/orderbook-settings.model';
import {DeviceService} from "../../../../shared/services/device.service";
import {NumberDisplayFormat} from '../../../../shared/models/enums/number-display-format';
import {
  WidgetSettingsBaseComponent
} from "../../../../shared/components/widget-settings/widget-settings-base.component";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {NzMarks, NzSliderComponent} from "ng-zorro-antd/slider";
import {WidgetSettingsComponent} from '../../../../shared/components/widget-settings/widget-settings.component';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzCollapseComponent, NzCollapsePanelComponent} from 'ng-zorro-antd/collapse';
import {InstrumentSearchComponent} from '../../../../shared/components/instrument-search/instrument-search.component';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {
  InstrumentBoardSelectComponent
} from '../../../../shared/components/instrument-board-select/instrument-board-select.component';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-orderbook-settings',
  templateUrl: './orderbook-settings.component.html',
  styleUrls: ['./orderbook-settings.component.less'],
  imports: [
    WidgetSettingsComponent,
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    InstrumentSearchComponent,
    NzInputDirective,
    InstrumentBoardSelectComponent,
    NzSliderComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzSwitchComponent,
    NzIconDirective,
    NzPopoverDirective,
    AsyncPipe
  ]
})
export class OrderbookSettingsComponent extends WidgetSettingsBaseComponent<OrderbookSettings> implements OnInit {
  protected readonly settingsService: WidgetSettingsService;
  protected readonly manageDashboardsService: ManageDashboardsService;
  protected readonly destroyRef: DestroyRef;
  private readonly deviceService = inject(DeviceService);
  private readonly formBuilder = inject(FormBuilder);

  readonly validationOptions = {
    depth: {
      min: 1,
      max: 50
    }
  };

  columnsOrderEnum = ColumnsOrder;

  readonly availableNumberFormats = Object.values(NumberDisplayFormat);

  readonly settingsChange = output<void>();

  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
    instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
    depth: this.formBuilder.nonNullable.control(
      17,
      [
        Validators.required,
        Validators.min(this.validationOptions.depth.min),
        Validators.max(this.validationOptions.depth.max)
      ]
    ),
    showChart: this.formBuilder.nonNullable.control(true),
    showTable: this.formBuilder.nonNullable.control(true),
    showYieldForBonds: this.formBuilder.nonNullable.control(false),
    useOrderWidget: this.formBuilder.nonNullable.control(false),
    showVolume: this.formBuilder.nonNullable.control(false),
    columnsOrder: this.formBuilder.nonNullable.control(ColumnsOrder.VolumesAtTheEdges),
    volumeDisplayFormat: this.formBuilder.nonNullable.control(NumberDisplayFormat.Default),
    showPriceWithZeroPadding: this.formBuilder.nonNullable.control(false),
  });

  deviceInfo$!: Observable<any>;

  protected settings$!: Observable<OrderbookSettings>;

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
    super.ngOnInit();

    this.deviceInfo$ = this.deviceService.deviceInfo$
      .pipe(
        take(1)
      );
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  getSliderMarks(minValue: number, maxValue: number): NzMarks {
    return {
      [minValue]: minValue.toString(),
      [maxValue]: maxValue.toString(),
    };
  }

  protected getUpdatedSettings(initialSettings: OrderbookSettings): Partial<OrderbookSettings> {
    const formValue = this.form.getRawValue() as Partial<OrderbookSettings & { instrument: InstrumentKey }>;

    const newSettings = {
      ...formValue,
      depth: Number(this.form.value.depth!),
      symbol: formValue.instrument?.symbol,
      exchange: formValue.instrument?.exchange
    } as OrderbookSettings;

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && isInstrumentEqual(initialSettings, newSettings);

    return newSettings;
  }

  protected setCurrentFormValues(settings: OrderbookSettings): void {
    this.form.reset();

    this.form.controls.instrument.setValue({
      symbol: settings.symbol,
      exchange: settings.exchange,
      instrumentGroup: settings.instrumentGroup ?? null
    });
    this.form.controls.instrumentGroup.setValue(settings.instrumentGroup ?? null);

    this.form.controls.depth.setValue(settings.depth ?? 17);
    this.form.controls.showChart.setValue(settings.showChart);
    this.form.controls.showTable.setValue(settings.showTable);
    this.form.controls.showYieldForBonds.setValue(settings.showYieldForBonds);
    this.form.controls.useOrderWidget.setValue(settings.useOrderWidget ?? false);
    this.form.controls.showVolume.setValue(settings.showVolume ?? false);
    this.form.controls.columnsOrder.setValue(settings.columnsOrder ?? ColumnsOrder.VolumesAtTheEdges);
    this.form.controls.volumeDisplayFormat.setValue(settings.volumeDisplayFormat ?? NumberDisplayFormat.Default);
    this.form.controls.showPriceWithZeroPadding.setValue(settings.showPriceWithZeroPadding ?? false);
  }
}
