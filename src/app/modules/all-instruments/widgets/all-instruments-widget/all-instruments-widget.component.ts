import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";

@Component({
  selector: 'ats-all-instruments-widget',
  templateUrl: './all-instruments-widget.component.html',
  styleUrls: ['./all-instruments-widget.component.less']
})
export class AllInstrumentsWidgetComponent {
  @Input() public shouldShowSettings!: boolean;
  @Input() public guid!: string;
  @Input() public resize!: EventEmitter<DashboardItem>;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
