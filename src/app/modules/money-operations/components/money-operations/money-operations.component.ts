import { Component, OnInit } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { MoneyInputComponent } from '../money-input/money-input.component';
import { MoneyWithdrawalComponent } from '../money-withdrawal/money-withdrawal.component';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'ats-money-operations',
  standalone: true,
  imports: [
    NzTabsModule,
    MoneyInputComponent,
    MoneyWithdrawalComponent,
    TranslocoDirective
  ],
  templateUrl: './money-operations.component.html',
  styleUrls: ['./money-operations.component.less']
})
export class MoneyOperationsComponent implements OnInit {
  activeTab: number = 0;

  constructor() { }

  ngOnInit(): void {
  }
}
