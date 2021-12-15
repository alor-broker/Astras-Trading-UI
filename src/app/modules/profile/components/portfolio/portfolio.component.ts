import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PortfolioService } from '../../services/portfolio.service';
import { Portfolio } from '../../models/portfolio.model'
import { Position } from '@angular/compiler';
import { OrderbookRow } from 'src/app/modules/orderbook/models/orderbook-row.model';

@Component({
  selector: 'ats-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.sass']
})
export class PortfolioComponent implements OnInit {

  constructor(private service: PortfolioService) {
    this.portfolio$ = new Observable();
  }

  rowData : OrderbookRow[] = [
    { volume: 10, price: 100 },
    { volume: 20, price: 150 },
  ] ;

  portfolio$: Observable<Portfolio>

  ngOnInit(): void {
    this.portfolio$ = this.service.get()
  }

}
