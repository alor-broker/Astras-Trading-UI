import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import { LightChartService } from '../../services/light-chart.service';
import { Timeframe, TimeframesHelper } from '../../utils/timeframes-helper';

@Component({
  selector: 'ats-light-chart-settings[guid]',
  templateUrl: './light-chart-settings.component.html',
  styleUrls: ['./light-chart-settings.component.less']
})
export class LightChartSettingsComponent implements OnInit {
  @Input()
  guid!: string;

  @Output()
  settingsChange: EventEmitter<LightChartSettings> = new EventEmitter<LightChartSettings>();

  form!: FormGroup;
  timeFrames: Timeframe[];
  prevSettings?: LightChartSettings;

  constructor(private service: LightChartService ) {
    this.timeFrames = TimeframesHelper.timeFrames;
  }

  ngOnInit() {
    this.service.getSettings(this.guid).subscribe(settings => {
      if (settings) {
        this.prevSettings = settings;
        this.form = new FormGroup({
          symbol: new FormControl(settings.symbol, [
            Validators.required,
            Validators.minLength(4)
          ]),
          exchange: new FormControl(settings.exchange, Validators.required),
          timeFrame: new FormControl(settings.timeFrame, Validators.required),
          instrumentGroup: new FormControl(settings.instrumentGroup)
        });
      }
    });
  }

  submitForm(): void {
    this.service.setSettings({
      ...this.prevSettings,
      ...this.form.value,
      linkToActive: false
    });
    this.settingsChange.emit();
  }
}
