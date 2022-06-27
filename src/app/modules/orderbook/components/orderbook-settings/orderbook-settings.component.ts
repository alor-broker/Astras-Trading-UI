import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { OrderbookService } from '../../services/orderbook.service';

interface SettingsFormData {
  depth: number,
  exchange: string,
  symbol: string,
  instrumentGroup: string,
  showChart: boolean,
  showTable: boolean,
  showYieldForBonds: boolean,
}

type SettingsFormControls = { [key in keyof SettingsFormData]: AbstractControl };
type SettingsFormGroup = FormGroup & { value: SettingsFormData, controls: SettingsFormControls };

@Component({
  selector: 'ats-orderbook-settings[settingsChange][guid]',
  templateUrl: './orderbook-settings.component.html',
  styleUrls: ['./orderbook-settings.component.less']
})
export class OrderbookSettingsComponent implements OnInit {
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();

  form!: SettingsFormGroup;
  readonly validationOptions = {
    minDepth: 0,
    maxDepth: 20
  };

  constructor(private service: OrderbookService ) { }

  ngOnInit() {
    this.service.getSettings(this.guid).subscribe(settings => {
      if (settings) {
        this.form = new FormGroup({
          symbol: new FormControl(settings.symbol, [
            Validators.required,
            Validators.minLength(1)
          ]),
          exchange: new FormControl(settings.exchange, Validators.required),
          depth: new FormControl(settings.depth, [Validators.required, Validators.min(this.validationOptions.minDepth), Validators.max(this.validationOptions.maxDepth)]),
          instrumentGroup: new FormControl(settings.instrumentGroup),
          showChart: new FormControl(settings.showChart),
          showTable: new FormControl(settings.showTable),
          showYieldForBonds: new FormControl(settings.showYieldForBonds)
        } as SettingsFormControls) as SettingsFormGroup;
      }
    });
  }

  submitForm(): void {
    this.service.setSettings({
      ...this.form.value,
      guid: this.guid,
      linkToActive: false
    });
    this.settingsChange.emit();
  }
}
