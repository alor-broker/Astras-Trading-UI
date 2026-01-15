import {Component, input} from '@angular/core';
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
  readonly direction = input.required<'up' | 'down'>();

  readonly visible = input.required<boolean>();

  readonly hideTooltips = input(false);
}
