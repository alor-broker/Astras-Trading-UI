import {
  ChangeDetectionStrategy,
  Component,
  Input,
  EventEmitter,
  ViewEncapsulation,
  OnInit,
} from '@angular/core';
import { GridsterItem } from 'angular-gridster2';
import { OrderbookSettings } from 'src/app/modules/orderbook/models/orderbook-settings.model';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { WidgetSettings } from 'src/app/shared/models/widget-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';

@Component({
  selector: 'ats-parent-widget[widget][resize]',
  templateUrl: './parent-widget.component.html',
  styleUrls: ['./parent-widget.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ParentWidgetComponent implements OnInit {

  @Input()
  widget!: Widget;
  @Input()
  resize! : EventEmitter<GridsterItem>;

  shouldShowSettings: boolean = false;

  constructor() {  }

  ngOnInit(): void {}

  onSwitchSettings(value: boolean) {
    this.shouldShowSettings = value;
  }
}
