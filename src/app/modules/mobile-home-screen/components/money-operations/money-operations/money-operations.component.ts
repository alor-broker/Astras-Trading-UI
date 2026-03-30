import { Component } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { MoneyInputComponent } from '../money-input/money-input.component';
import { MoneyWithdrawalComponent } from '../money-withdrawal/money-withdrawal.component';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'ats-money-operations',
  imports: [
    NzTabsModule,
    MoneyInputComponent,
    MoneyWithdrawalComponent,
    TranslocoDirective
  ],
  templateUrl: './money-operations.component.html',
  styleUrls: ['./money-operations.component.less']
})
export class MoneyOperationsComponent {
  activeTab = 0;
}
