import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import {
  Timeframe,
  TimeframesHelper
} from '../../utils/timeframes-helper';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  Observable,
  shareReplay,
  Subject,
  take,
  takeUntil
} from "rxjs";
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import {
  LightChartSettings,
  TimeFrameDisplayMode
} from '../../models/light-chart-settings.model';

@Component({
  selector: 'ats-light-chart-settings[guid]',
  templateUrl: './light-chart-settings.component.html',
  styleUrls: ['./light-chart-settings.component.less']
})
export class LightChartSettingsComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<LightChartSettings> = new EventEmitter<LightChartSettings>();
  form!: UntypedFormGroup;
  timeFrames: Timeframe[];
  timeFrameDisplayModes = TimeFrameDisplayMode;
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();
  private settings$!: Observable<LightChartSettings>;

  constructor(private readonly settingsService: WidgetSettingsService) {
    this.timeFrames = TimeframesHelper.timeFrames;
  }

  ngOnInit() {
    this.settings$ = this.settingsService.getSettings<LightChartSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.settings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.form = new UntypedFormGroup({
        instrument: new UntypedFormControl({
          symbol: settings.symbol,
          exchange: settings.exchange,
          instrumentGroup: settings.instrumentGroup
        } as InstrumentKey, Validators.required),
        exchange: new UntypedFormControl({ value: settings.exchange, disabled: true }, Validators.required),
        timeFrame: new UntypedFormControl(settings.timeFrame, Validators.required),
        timeFrameDisplayMode: new UntypedFormControl(settings.timeFrameDisplayMode ?? TimeFrameDisplayMode.Buttons, Validators.required),
        instrumentGroup: new UntypedFormControl(settings.instrumentGroup)
      });
    });
  }

  submitForm(): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      const formValue = this.form.value;
      const newSettings = {
        ...formValue,
        symbol: formValue.instrument.symbol,
        exchange: formValue.instrument.exchange,
      };

      delete newSettings.instrument;

      newSettings.linkToActive = initialSettings.linkToActive && isInstrumentEqual(initialSettings, newSettings);

      this.settingsService.updateSettings<LightChartSettings>(this.guid, newSettings);
      this.settingsChange.emit();
    });
  }

  instrumentSelected(instrument: InstrumentKey | null) {
    this.form.controls.exchange.setValue(instrument?.exchange ?? null);
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
