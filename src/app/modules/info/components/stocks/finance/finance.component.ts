import { Component, Input, OnInit } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { formatCurrency } from 'src/app/shared/utils/formatters';
import { Finance } from '../../../models/finance.model';
import { InfoService } from '../../../services/info.service';

@Component({
  selector: 'ats-finance',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.less']
})
export class FinanceComponent implements OnInit {
  @Input()
  guid!: string;

  columns = 1;

  finance$?: Observable<Finance>;
  private currency = "RUB";

  constructor(private service: InfoService) { }

  ngOnInit(): void {
    this.finance$ = this.service.getFinance().pipe(
      tap(f => this.currency = f.currency)
    );
  }
  format(number: number) {
    return formatCurrency(number, this.currency, 0);
  }

  formatCurrency(number: number) {
    return formatCurrency(number, this.currency, 0);
  }
}
