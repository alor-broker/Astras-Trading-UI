import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";

@Component({
  selector: 'ats-news-widget',
  templateUrl: './news-widget.component.html',
  styleUrls: ['./news-widget.component.less']
})
export class NewsWidgetComponent {

  @Input() public shouldShowSettings!: boolean;
  @Input() public guid!: string;
  @Input() public resize!: EventEmitter<DashboardItem>;
  @Input() public heightAdjustment!: number;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();

  constructor() { }

}
