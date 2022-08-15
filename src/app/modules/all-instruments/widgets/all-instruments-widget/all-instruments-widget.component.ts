import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: 'ats-all-instruments-widget',
  templateUrl: './all-instruments-widget.component.html',
  styleUrls: ['./all-instruments-widget.component.less']
})
export class AllInstrumentsWidgetComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public shouldShowSettings!: boolean;
  @Input() public guid!: string;
  @Input() public resize!: EventEmitter<DashboardItem>;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private resizeLastValue!: DashboardItem;

  ngOnInit() {
    this.resize.pipe(
      takeUntil(this.destroy$)
    )
      .subscribe(val => this.resizeLastValue = val);
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.shouldShowSettings && !changes.shouldShowSettings.currentValue) {
      setTimeout(() => this.resize.emit(this.resizeLastValue), 0);
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
