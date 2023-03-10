import {
  Component,
  Input
} from '@angular/core';

@Component({
  selector: 'ats-orders-indicator[direction][visible]',
  templateUrl: './orders-indicator.component.html',
  styleUrls: ['./orders-indicator.component.less']
})
export class OrdersIndicatorComponent {

  @Input()
  direction: 'up' | 'down' = 'up';

  @Input()
  visible = false;
}
