import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import { LightChartService } from '../../services/light-chart.service';

@Component({
  selector: 'ats-light-chart-settings',
  templateUrl: './light-chart-settings.component.html',
  styleUrls: ['./light-chart-settings.component.sass']
})
export class LightChartSettingsComponent implements OnInit {

  @Output()
  settingsChange: EventEmitter<LightChartSettings> = new EventEmitter<LightChartSettings>();

  form!: FormGroup;

  constructor(private service: LightChartService ) { }

  ngOnInit() {
    this.service.settings$.subscribe(settings => {
      if (settings) {
        this.form = new FormGroup({
          symbol: new FormControl(settings.symbol, [
            Validators.required,
            Validators.minLength(4)
          ]),
          exchange: new FormControl(settings.exchange, Validators.required),
        });
      }
    })
  }

  submitForm(): void {
    this.settingsChange.emit(this.form.value)
    console.log('submit', this.form.value);
  }
}
