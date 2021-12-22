import {
  ChangeDetectionStrategy,
  Component,
  Input,
  EventEmitter,
  ViewEncapsulation,
  OnInit,
} from '@angular/core';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { AnySettings } from '../../../../shared/models/settings/any-settings.model';

@Component({
  selector: 'ats-parent-widget[widget][resize]',
  templateUrl: './parent-widget.component.html',
  styleUrls: ['./parent-widget.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ParentWidgetComponent implements OnInit {

  @Input()
  widget!: Widget<AnySettings>;
  @Input()
  resize! : EventEmitter<DashboardItem>;

  shouldShowSettings: boolean = false;

  constructor() {  }

  ngOnInit(): void {}

  onSwitchSettings(value: boolean) {
    this.shouldShowSettings = value;
  }
}
