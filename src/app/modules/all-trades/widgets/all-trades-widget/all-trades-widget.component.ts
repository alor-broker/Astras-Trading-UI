import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";

@Component({
  selector: 'ats-all-trades-widget',
  templateUrl: './all-trades-widget.component.html',
  styleUrls: ['./all-trades-widget.component.less']
})
export class AllTradesWidgetComponent {

  @Input() public shouldShowSettings!: boolean;
  @Input() public guid!: string;
  @Input() public resize!: EventEmitter<DashboardItem>;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();
}
