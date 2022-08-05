import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { TechChartDatafeedService } from "../../services/tech-chart-datafeed.service";
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";

@Component({
  selector: 'ats-tech-chart-widget[shouldShowSettings][guid][resize]',
  templateUrl: './tech-chart-widget.component.html',
  styleUrls: ['./tech-chart-widget.component.less'],
  providers: [TechChartDatafeedService]
})
export class TechChartWidgetComponent {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  constructor() {
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
