import {
  ChangeDetectionStrategy,
  Component,
  Input,
  EventEmitter,
  ViewEncapsulation,
  OnInit,
} from '@angular/core';
import { OrderbookSettings } from 'src/app/modules/orderbook/models/orderbook-settings.model';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';

@Component({
  selector: 'ats-parent-widget[widget][resize]',
  templateUrl: './parent-widget.component.html',
  styleUrls: ['./parent-widget.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ParentWidgetComponent implements OnInit {

  @Input()
  widget!: DashboardItem;
  @Input()
  resize! : EventEmitter<DashboardItem>;

  shouldShowSettings: boolean = false;

  constructor() {  }

  ngOnInit(): void {}

  onSwitchSettings(value: boolean) {
    this.shouldShowSettings = value;
  }
}
