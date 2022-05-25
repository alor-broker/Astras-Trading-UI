import { LayoutModule } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NavbarComponent } from './navbar.component';
import { AccountService } from '../../../../shared/services/account.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { of } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import { PortfolioExtended } from '../../../../shared/models/user/portfolio-extended.model';
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  const spyAccount = jasmine.createSpyObj('AccountService', ['getActivePortfolios']);
  spyAccount.getActivePortfolios.and.returnValue(of([]));
  const spyDashboard = jasmine.createSpy('DashboardService');
  const spyAuth = jasmine.createSpyObj('AuthService', ['logout']);
  const spyModal = jasmine.createSpyObj('ModalService', ['openTerminalSettingsModal']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NavbarComponent],
      imports: [
        NoopAnimationsModule,
        LayoutModule,
        ...sharedModuleImportForTests
      ],
      providers: [
        { provide: AccountService, useValue: spyAccount },
        { provide: DashboardService, useValue: spyDashboard },
        { provide: AuthService, useValue: spyAuth },
        { provide: ModalService, useValue: spyModal }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should compile', () => {
    expect(component).toBeTruthy();
  });

  it('selectDefault should select FOND portfolio', () => {
    const portfolios = new Map<string, PortfolioExtended[]>();
    portfolios.set(
      '1234',
      [{
        exchange: 'MOEX',
        portfolio: 'D39004',
        tks: 'L01-00000F00',
        market: 'Фонд MOEX',
        agreement: '1234'
      },
        {
          exchange: 'MOEX',
          portfolio: '7500GHC',
          tks: '7500GHC',
          market: 'Срочный',
          agreement: '1234'
        }]
    );

    const portfolio = component.selectDefault(portfolios);
    expect(portfolio.portfolio).toEqual("D39004");
  });
});
