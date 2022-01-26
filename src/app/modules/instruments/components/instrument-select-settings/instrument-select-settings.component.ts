import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { InstrumentSelectSettings } from 'src/app/shared/models/settings/instrument-select-settings.model';

@Component({
  selector: 'ats-instrument-select-settings',
  templateUrl: './instrument-select-settings.component.html',
  styleUrls: ['./instrument-select-settings.component.less']
})
export class InstrumentSelectSettingsComponent implements OnInit {
  @Output()
  settingsChange: EventEmitter<InstrumentSelectSettings> = new EventEmitter<InstrumentSelectSettings>();

  constructor() { }

  ngOnInit(): void {
  }

}
