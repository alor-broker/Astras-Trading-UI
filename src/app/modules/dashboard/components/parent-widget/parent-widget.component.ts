import {
  ChangeDetectionStrategy,
  Component,
  Input,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { Widget } from 'src/app/shared/models/widget.model';

@Component({
  selector: 'ats-parent-widget[widget][resize]',
  templateUrl: './parent-widget.component.html',
  styleUrls: ['./parent-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentWidgetComponent implements OnInit {

  @Input()
  widget!: Widget;
  @Input()
  resize! : EventEmitter<DashboardItem>;

  @Output()
  widgetResize: EventEmitter<DashboardItem> = new EventEmitter<DashboardItem>();

  shouldShowSettings: boolean = false;
  isLinked: boolean = true;

  constructor() { }

  ngOnInit(): void {
    this.resize.subscribe(i => {
      if(i.label == this.widget.gridItem.label) {
        this.widgetResize.emit(i);
      }
    });
  }

  onSwitchSettings(value: boolean) {
    this.shouldShowSettings = value;
  }

  onLinkedChanged(isLinked: boolean) {
    this.isLinked = isLinked;
  }

  getGuid() {
    const obWidget = this.widget as Widget;
    return obWidget.guid;
  }

  hasSettings() {
    const obWidget = this.widget as Widget;
    return obWidget.hasSettings;
  }

  hasHelp() {
    const obWidget = this.widget as Widget;
    return obWidget.hasHelp;
  }

  get contentHeightAdjustment(): number {
    // TODO: need to calculate this value. Now it depends on styles
    return 40;
  }
}
