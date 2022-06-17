import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import { AllTradesService } from "../../services/all-trades.service";

@Component({
  selector: 'ats-all-trades-widget',
  templateUrl: './all-trades-widget.component.html',
  styleUrls: ['./all-trades-widget.component.less'],
  providers: [AllTradesService]
})
export class AllTradesWidgetComponent implements OnInit {

  @Input() public shouldShowSettings!: boolean;
  @Input() public guid!: string;
  @Input() public heightAdjustment!: number;
  @Input() public resize!: EventEmitter<DashboardItem>;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();

  constructor(private allTradesService: AllTradesService) {}

  public ngOnInit(): void {
    this.allTradesService.init(this.guid);
  }
}
