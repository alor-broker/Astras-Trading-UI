import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PortfolioService } from '../../services/portfolio.service';
import { Portfolio } from '../../models/portfolio.model'
import { Position } from '@angular/compiler';

@Component({
  selector: 'ats-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.sass']
})
export class PortfolioComponent implements OnInit {

  constructor(
    private service: PortfolioService
    ) {
    this.portfolio$ = new Observable();
  }

  portfolio$: Observable<Portfolio>

  ngOnInit(): void {
    this.portfolio$ = this.service.get()
  }

}
