import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AuthService } from 'src/app/shared/services/auth.service';
import { AccountService } from '../../services/account.service';
import { PortfolioKey } from '../../models/portfolio-key.model';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { DashboardService } from 'src/app/shared/services/dashboard.service';

@Component({
  selector: 'ats-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.sass'],
})
export class NavbarComponent implements OnInit{

  portfolios$!: Observable<PortfolioKey[]>

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver,
    private service: DashboardService,
    private account: AccountService
  ) {}

  ngOnInit(): void {
    this.portfolios$ = this.account.getActivePortfolios();
  }

  addItem(type: string): void {
    this.service.addWidget({
      gridItem: {
        x: 0,
        y: 0,
        cols: 1,
        rows: 1,
        type: type,
      },
    });
  }
}
