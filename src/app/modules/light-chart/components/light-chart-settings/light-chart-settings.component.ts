import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Observable, take} from "rxjs";
import {isInstrumentEqual} from '../../../../shared/utils/settings-helper';
import {InstrumentKey} from '../../../../shared/models/instruments/instrument-key.model';
import {LightChartWidgetSettings, TimeFrameDisplayMode} from '../../models/light-chart-settings.model';
import {DeviceService} from "../../../../shared/services/device.service";
import {
  WidgetSettingsBaseComponent
} from "../../../../shared/components/widget-settings/widget-settings-base.component";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {TimeframeValue} from "../../models/light-chart.models";
import {WidgetSettingsComponent} from '../../../../shared/components/widget-settings/widget-settings.component';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {InstrumentSearchComponent} from '../../../../shared/components/instrument-search/instrument-search.component';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {RemoveSelectTitlesDirective} from '../../../../shared/directives/remove-select-titles.directive';
import {NzCollapseComponent, NzCollapsePanelComponent} from 'ng-zorro-antd/collapse';
import {
  InstrumentBoardSelectComponent
} from '../../../../shared/components/instrument-board-select/instrument-board-select.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-light-chart-settings',
  templateUrl: './light-chart-settings.component.html',
  styleUrls: ['./light-chart-settings.component.less'],
  imports: [
    WidgetSettingsComponent,
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    NzFormLabelComponent,
    InstrumentSearchComponent,
    NzInputDirective,
    NzSelectComponent,
    RemoveSelectTitlesDirective,
    NzOptionComponent,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    InstrumentBoardSelectComponent,
    AsyncPipe
  ]
})
export class LightChartSettingsComponent extends WidgetSettingsBaseComponent<LightChartWidgetSettings> implements OnInit {
  protected readonly settingsService: WidgetSettingsService;
  protected readonly manageDashboardsService: ManageDashboardsService;
  protected readonly destroyRef: DestroyRef;
  private readonly deviceService = inject(DeviceService);
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
    timeFrame: this.formBuilder.nonNullable.control(TimeframeValue.Day, Validators.required),
    timeFrameDisplayMode: this.formBuilder.nonNullable.control(TimeFrameDisplayMode.Buttons, Validators.required),
    instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
    availableTimeFrames: this.formBuilder.nonNullable.control<TimeframeValue[]>([], Validators.required)
  });

  readonly allTimeFrames = Object.values(TimeframeValue);
  timeFrameDisplayModes = TimeFrameDisplayMode;
  deviceInfo$!: Observable<any>;
  protected settings$!: Observable<LightChartWidgetSettings>;

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

  checkCurrentTimeFrame(): void {
    const availableTimeFrames = this.sortTimeFrames(this.form.controls.availableTimeFrames.value);
    if (availableTimeFrames.length > 0 && !availableTimeFrames.includes(this.form.controls.timeFrame.value)) {
      this.form.controls.timeFrame.setValue(availableTimeFrames[availableTimeFrames.length - 1]);
    }
  }

  protected getUpdatedSettings(initialSettings: LightChartWidgetSettings): Partial<LightChartWidgetSettings> {
    const formValue = this.form.value as Partial<LightChartWidgetSettings & { instrument: InstrumentKey }>;
    const newSettings = {
      ...formValue,
      symbol: formValue.instrument?.symbol,
      exchange: formValue.instrument?.exchange
    } as LightChartWidgetSettings & { instrument?: InstrumentKey };

    newSettings.availableTimeFrames = this.sortTimeFrames(newSettings.availableTimeFrames ?? []);

    delete newSettings.instrument;

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && isInstrumentEqual(initialSettings, newSettings);

    return newSettings;
  }

  protected setCurrentFormValues(settings: LightChartWidgetSettings): void {
    this.form.reset();

    this.form.controls.instrument.setValue({
      symbol: settings.symbol,
      exchange: settings.exchange,
      instrumentGroup: settings.instrumentGroup ?? null
    });
    this.form.controls.instrumentGroup.setValue(settings.instrumentGroup ?? null);

    this.form.controls.timeFrame.setValue(settings.timeFrame);
    this.form.controls.timeFrameDisplayMode.setValue(settings.timeFrameDisplayMode ?? TimeFrameDisplayMode.Buttons);
    this.form.controls.availableTimeFrames.setValue(settings.availableTimeFrames ?? this.allTimeFrames);
  }

  private sortTimeFrames(selectedTimeFrames: TimeframeValue[]): TimeframeValue[] {
    return [...selectedTimeFrames].sort((a, b) => {
      const aIndex = this.allTimeFrames.indexOf(a);
      const bIndex = this.allTimeFrames.indexOf(b);

      return aIndex - bIndex;
    });
  }
}
