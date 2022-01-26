import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { BlotterService } from 'src/app/shared/services/blotter.service';

@Component({
  selector: 'ats-blotter-settings',
  templateUrl: './blotter-settings.component.html',
  styleUrls: ['./blotter-settings.component.less']
})
export class BlotterSettingsComponent implements OnInit {

  @Output()
  settingsChange: EventEmitter<BlotterSettings> = new EventEmitter<BlotterSettings>();

  form!: FormGroup;

  constructor(private service: BlotterService ) { }

  ngOnInit() {
    this.service.settings$.subscribe(settings => {
      if (settings) {
        this.form = new FormGroup({
          portfolio: new FormControl(settings.portfolio, [
            Validators.required,
            Validators.minLength(4)
          ]),
          exchange: new FormControl(settings.exchange, Validators.required),
        });
      }
    })
  }

  submitForm(): void {
    this.settingsChange.emit({ ...this.form.value, linkToActive: false})
  }
}
