import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { OrderbookSettings } from '../../../../shared/models/settings/orderbook-settings.model';
import { OrderbookService } from '../../services/orderbook.service';

@Component({
  selector: 'ats-orderbook-settings[settingsChange]',
  templateUrl: './orderbook-settings.component.html',
  styleUrls: ['./orderbook-settings.component.sass']
})
export class OrderbookSettingsComponent implements OnInit {
  @Output()
  settingsChange: EventEmitter<OrderbookSettings> = new EventEmitter<OrderbookSettings>();

  form!: FormGroup;

  constructor(private service: OrderbookService ) { }

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
