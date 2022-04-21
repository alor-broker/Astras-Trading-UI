import { Component, Input} from '@angular/core';
import { ExchangeInfo } from '../../../models/exchange-info.model';

@Component({
  selector: 'ats-info-header[info]',
  templateUrl: './info-header.component.html',
  styleUrls: ['./info-header.component.less']
})
export class InfoHeaderComponent {
  @Input()
  info!: ExchangeInfo;

  constructor() { }
}
