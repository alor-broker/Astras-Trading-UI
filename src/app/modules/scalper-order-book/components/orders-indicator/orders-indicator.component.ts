import {Component, Input} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'ats-orders-indicator',
  templateUrl: './orders-indicator.component.html',
  styleUrls: ['./orders-indicator.component.less'],
  imports: [
    TranslocoDirective,
    NzIconDirective,
    NzTooltipDirective
  ]
})
export class OrdersIndicatorComponent {
  @Input({required: true})
  direction: 'up' | 'down' = 'up';

  @Input({required: true})
  visible = false;

  @Input()
  hideTooltips = false;
}
