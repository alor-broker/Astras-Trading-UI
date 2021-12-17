import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { OrderbookSettings } from '../../models/orderbook-settings.model';

@Component({
  selector: 'ats-orderbook-settings[settingsChange][settings]',
  templateUrl: './orderbook-settings.component.html',
  styleUrls: ['./orderbook-settings.component.sass']
})
export class OrderbookSettingsComponent implements OnInit {

  @Input()
  settings!: OrderbookSettings;

  @Output()
  settingsChange: EventEmitter<OrderbookSettings> = new EventEmitter<OrderbookSettings>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.form = new FormGroup({
      symbol: new FormControl(this.settings.symbol, [
        Validators.required,
        Validators.minLength(4)
      ]),
      exchange: new FormControl(this.settings.exchange, Validators.required),
    });
  }

  submitForm(): void {
    this.settingsChange.emit(this.form.value)
    console.log('submit', this.form.value);
  }
}
