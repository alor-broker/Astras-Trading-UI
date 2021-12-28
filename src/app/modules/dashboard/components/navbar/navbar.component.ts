import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AuthService } from 'src/app/shared/services/auth.service';
import { AccountService } from '../../services/account.service';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { PortfolioKey } from 'src/app/shared/models/portfolio-key.model';

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
    private account: AccountService,
    private sync: SyncService
  ) {}

  ngOnInit(): void {
    this.portfolios$ = this.account.getActivePortfolios();
    this.portfolios$.subscribe(portfolios => {
      this.changePortfolio(this.selectDefault(portfolios));
    })
  }

  clear() {
    this.service.clearDashboard();
  }

  selectDefault(portfolios: PortfolioKey[]) {
    return portfolios.find(p => p.exchange == 'MOEX' && p.portfolio.startsWith('D')) ?? portfolios[0];
  }

  changePortfolio(key: PortfolioKey) {
    this.sync.selectNewPortfolio(key);
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
