import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { TechChartDatafeedService } from "../../services/tech-chart-datafeed.service";
import {
  DashboardItem,
  DashboardItemContentSize
} from "../../../../shared/models/dashboard-item.model";
import { map } from "rxjs/operators";
import {
  Observable,
  shareReplay
} from "rxjs";

@Component({
  selector: 'ats-tech-chart-widget[shouldShowSettings][guid][resize]',
  templateUrl: './tech-chart-widget.component.html',
  styleUrls: ['./tech-chart-widget.component.less'],
  providers: [TechChartDatafeedService]
})
export class TechChartWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  contentSize$!: Observable<DashboardItemContentSize>;

  constructor() {
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }

  ngOnInit(): void {
    this.contentSize$ = this.resize.pipe(
      map(x => ({
        height: x.height,
        width: x.width
      } as DashboardItemContentSize)),
      shareReplay(1)
    );
  }
}
