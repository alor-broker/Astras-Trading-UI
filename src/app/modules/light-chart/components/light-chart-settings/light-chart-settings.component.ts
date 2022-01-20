import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import { LightChartService } from '../../services/light-chart.service';
import { Timeframe, TimeframesHelper } from '../../utils/timeframes-helper';

@Component({
  selector: 'ats-light-chart-settings',
  templateUrl: './light-chart-settings.component.html',
  styleUrls: ['./light-chart-settings.component.sass']
})
export class LightChartSettingsComponent implements OnInit {

  @Output()
  settingsChange: EventEmitter<LightChartSettings> = new EventEmitter<LightChartSettings>();

  form!: FormGroup;

  timeFrames: Timeframe[]

  constructor(private service: LightChartService ) {
    const helper = new TimeframesHelper();
    this.timeFrames = helper.timeFrames;
  }

  ngOnInit() {
    this.service.settings$.subscribe(settings => {
      if (settings) {
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
    })
  }

  submitForm(): void {
    this.settingsChange.emit({...this.form.value, linkToActive: false})
  }
}
