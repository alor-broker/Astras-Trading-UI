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
  LightChartSettings,
  TimeFrameDisplayMode
} from 'src/app/shared/models/settings/light-chart-settings.model';
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
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import { InstrumentValidation } from '../../../../shared/utils/validation-options';
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';

@Component({
  selector: 'ats-light-chart-settings[guid]',
  templateUrl: './light-chart-settings.component.html',
  styleUrls: ['./light-chart-settings.component.less']
})
export class LightChartSettingsComponent implements OnInit, OnDestroy {
  readonly validationOptions = InstrumentValidation;
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<LightChartSettings> = new EventEmitter<LightChartSettings>();
  form!: UntypedFormGroup;
  timeFrames: Timeframe[];
  timeFrameDisplayModes = TimeFrameDisplayMode;
  exchanges: string[] = exchangesList;
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
        symbol: new UntypedFormControl(settings.symbol, [
          Validators.required,
          Validators.minLength(this.validationOptions.symbol.min),
          Validators.maxLength(this.validationOptions.symbol.max)
        ]),
        exchange: new UntypedFormControl(settings.exchange, Validators.required),
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
      const newSettings = {
        ...this.form.value,
      };

      newSettings.linkToActive = initialSettings.linkToActive && isInstrumentEqual(initialSettings, newSettings);

      this.settingsService.updateSettings<LightChartSettings>(this.guid, newSettings);
      this.settingsChange.emit();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
