import { Component, Input, OnInit } from '@angular/core';
import { ExchangeInfo } from '../../models/exchange-info.model';

@Component({
  selector: 'ats-fallback-description[info]',
  templateUrl: './fallback-description.component.html',
  styleUrls: ['./fallback-description.component.less']
})
export class FallbackDescriptionComponent implements OnInit {
  @Input()
  info!: ExchangeInfo

  constructor() { }

  ngOnInit(): void {
  }

}
