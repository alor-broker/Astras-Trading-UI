import { Component, input } from '@angular/core';
import { WidgetInstance } from '../../../../shared/models/dashboard/dashboard-item.model';
import { MoneyOperationsComponent } from '../../components/money-operations/money-operations.component';

@Component({
  selector: 'ats-money-operations-widget',
  standalone: true,
  imports: [
    MoneyOperationsComponent
  ],
  templateUrl: './money-operations-widget.component.html',
  styleUrls: ['./money-operations-widget.component.less']
})
export class MoneyOperationsWidgetComponent {
  widgetInstance = input.required<WidgetInstance>();
  isBlockWidget = input.required<boolean>();
}
