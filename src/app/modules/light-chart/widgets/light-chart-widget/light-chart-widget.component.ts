import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { LightChartService } from '../../services/light-chart.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";

@Component({
  selector: 'ats-light-chart-widget[shouldShowSettings][guid][resize]',
  templateUrl: './light-chart-widget.component.html',
  styleUrls: ['./light-chart-widget.component.less'],
  providers: [LightChartService]
})
export class LightChartWidgetComponent {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Input()
  heightAdjustment: number = 0;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  @Input()
  set linkedToActive(linkedToActive: boolean) {
    this.settingsService.updateIsLinked(this.guid, linkedToActive);
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
