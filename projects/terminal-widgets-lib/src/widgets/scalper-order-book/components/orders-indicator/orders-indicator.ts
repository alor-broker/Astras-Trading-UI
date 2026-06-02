import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'ats-orders-indicator',
  templateUrl: './orders-indicator.html',
  styleUrls: ['./orders-indicator.less'],
  imports: [
    TranslocoDirective,
    NzIconDirective,
    NzTooltipDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OrdersIndicator {
  readonly direction = input.required<'up' | 'down'>();

  readonly visible = input.required<boolean>();

  readonly hideTooltips = input(false);
}
