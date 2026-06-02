import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {NzTabsModule} from 'ng-zorro-antd/tabs';
import {TranslocoDirective} from '@jsverse/transloco';
import {MoneyInput} from '@terminal-widgets-lib/widgets/mobile-home-screen/components/money-operations/money-input/money-input';
import {MoneyWithdrawal} from '@terminal-widgets-lib/widgets/mobile-home-screen/components/money-operations/money-withdrawal/money-withdrawal';

@Component({
  selector: 'ats-money-operations',
  imports: [
    NzTabsModule,
    TranslocoDirective,
    MoneyInput,
    MoneyWithdrawal
  ],
  templateUrl: './money-operations.html',
  styleUrls: ['./money-operations.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MoneyOperations {
  activeTab = 0;
}
