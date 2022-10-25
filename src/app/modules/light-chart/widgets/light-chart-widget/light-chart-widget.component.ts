import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DashboardItem, DashboardItemContentSize } from 'src/app/shared/models/dashboard-item.model';
import { map } from "rxjs/operators";
import { Observable, shareReplay } from "rxjs";

@Component({
  selector: 'ats-light-chart-widget[shouldShowSettings][guid][resize]',
  templateUrl: './light-chart-widget.component.html',
  styleUrls: ['./light-chart-widget.component.less']
})
export class LightChartWidgetComponent implements OnInit {
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

  ngOnInit() {
    this.contentSize$ = this.resize.pipe(
      map(x => ({
        height: x.height,
        width: x.width
      } as DashboardItemContentSize)),
      shareReplay(1)
    );
  }
}
