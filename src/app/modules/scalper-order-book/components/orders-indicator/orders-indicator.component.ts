import {
  Component,
  Input
} from '@angular/core';

@Component({
    selector: 'ats-orders-indicator',
    templateUrl: './orders-indicator.component.html',
    styleUrls: ['./orders-indicator.component.less'],
    standalone: false
})
export class OrdersIndicatorComponent {
  @Input({required: true})
  direction: 'up' | 'down' = 'up';

  @Input({required: true})
  visible = false;

  @Input()
  hideTooltips = false;
}
