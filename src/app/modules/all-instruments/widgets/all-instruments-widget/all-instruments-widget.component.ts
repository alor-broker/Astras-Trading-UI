import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DashboardItem, DashboardItemContentSize } from "../../../../shared/models/dashboard-item.model";
import { map, Observable, shareReplay } from "rxjs";

@Component({
  selector: 'ats-all-instruments-widget',
  templateUrl: './all-instruments-widget.component.html',
  styleUrls: ['./all-instruments-widget.component.less']
})
export class AllInstrumentsWidgetComponent implements OnInit {
  @Input() public shouldShowSettings!: boolean;
  @Input() public guid!: string;
  @Input() public resize!: EventEmitter<DashboardItem>;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();
  contentSize$!: Observable<DashboardItemContentSize>;

  ngOnInit() {
    this.contentSize$ = this.resize.pipe(
      map(x => ({
        height: x.height,
        width: x.width
      } as DashboardItemContentSize)),
      shareReplay(1)
    );
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
