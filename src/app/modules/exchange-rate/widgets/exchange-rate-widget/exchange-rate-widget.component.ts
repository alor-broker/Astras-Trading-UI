import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";

@Component({
  selector: 'ats-exchange-rate-widget',
  templateUrl: './exchange-rate-widget.component.html',
  styleUrls: ['./exchange-rate-widget.component.less']
})
export class ExchangeRateWidgetComponent {

  @Input() public shouldShowSettings!: boolean;
  @Input() public guid!: string;
  @Input() public resize!: EventEmitter<DashboardItem>;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();

  constructor() { }

}
