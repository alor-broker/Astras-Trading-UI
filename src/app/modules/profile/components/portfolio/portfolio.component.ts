import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Portfolio } from '../../models/portfolio.model';
import { OrderbookRow } from 'src/app/modules/orderbook/models/orderbook-row.model';
import { ClientService } from 'src/app/shared/services/client.service';

@Component({
  selector: 'ats-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.less']
})
export class PortfolioComponent implements OnInit {

  constructor(private service: ClientService) {
    this.portfolio$ = new Observable();
  }

  rowData : OrderbookRow[] = [
    { volume: 10, price: 100 },
    { volume: 20, price: 150 },
  ];

  portfolio$: Observable<Portfolio>;

  ngOnInit(): void {
    this.portfolio$ = this.service.get();
  }

}
