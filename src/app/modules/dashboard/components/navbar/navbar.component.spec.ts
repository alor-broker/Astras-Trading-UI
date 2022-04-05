import { LayoutModule } from '@angular/cdk/layout';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NavbarComponent } from './navbar.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { PortfolioKey } from 'src/app/shared/models/portfolio-key.model';
import { AccountService } from '../../services/account.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { of } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import { SyncState } from 'src/app/shared/ngrx/reducers/sync.reducer';
import { Exchanges } from 'src/app/shared/models/enums/exchanges';
import { provideMockStore } from '@ngrx/store/testing';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  const spyAccount = jasmine.createSpyObj('AccountService', ['getActivePortfolios']);
  spyAccount.getActivePortfolios.and.returnValue(of([]));
  const spyDashboard = jasmine.createSpy('DashboardService');
  const spyAuth = jasmine.createSpyObj('AuthService', ['logout'])
  const spyModal= jasmine.createSpyObj('ModalService', ['openTerminalSettingsModal'])

  const initialState : SyncState = {
    instrument: {
      symbol: 'SBER',
      exchange: Exchanges.MOEX,
      instrumentGroup: 'TQBR',
      isin: 'RU0009029540'
    },
    portfolio: {
      portfolio: "D39004",
      exchange: Exchanges.MOEX
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NavbarComponent],
      imports: [
        NoopAnimationsModule,
        LayoutModule,
        SharedModule
      ],
      providers: [
        { provide: AccountService, useValue: spyAccount },
        { provide: DashboardService, useValue: spyDashboard },
        { provide: AuthService, useValue: spyAuth },
        { provide: ModalService, useValue: spyModal },
        provideMockStore({ initialState })
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });

  it('selectDefault should select FOND portfolio', () => {
    const portfolios : PortfolioKey[] = [{
      exchange: "MOEX",
      portfolio: "D39004"
    }, {
      exchange: "MOEX",
      portfolio: "7500GHC"
    }]
    const portfolio = component.selectDefault(portfolios);
    expect(portfolio).toEqual({
      exchange: "MOEX",
      portfolio: "D39004"
    });
  })
});
