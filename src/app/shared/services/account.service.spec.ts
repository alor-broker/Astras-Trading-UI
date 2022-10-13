import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { of } from "rxjs";
import { environment } from "../../../environments/environment";
import { MarketType } from "../models/portfolio-key.model";

describe('AccountService', () => {
  let service: AccountService;
  const spyAuth = jasmine.createSpyObj('AuthService', ['currentUser$']);
  const spyPositions = {
    getAllByLogin: jasmine.createSpy('getAllByLogin').and.returnValue(of([
      {
        portfolio: 'DtestPortfolio1',
        exchange: 'testExchange1'
      },
      {
        portfolio: 'GtestPortfolio2',
        exchange: 'testExchange2'
      },
      {
        portfolio: '1234',
        exchange: 'testExchange3'
      }
    ]))
  };
  let httpTestingController: HttpTestingController;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        AccountService,
        { provide: AuthService, useValue: spyAuth },
        { provide: PositionsService, useValue: spyPositions }
      ]
    });

    service = TestBed.inject(AccountService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get full name', fakeAsync(() => {
    spyAuth.currentUser$ = of({ login: 'testLogin' });

    const fullNameRes = {
      firstName: 'firstNameTest',
      lastName: 'lastNameTest',
      secondName: 'secondNameTest'
    };

    service.getFullName()
      .subscribe(res => expect(res).toEqual(fullNameRes));
    tick();

    const req = httpTestingController.expectOne(`${environment.clientDataUrl}/client/v1.0/users/testLogin/full-name`);

    expect(req.request.method).toEqual('GET');

    req.flush(fullNameRes);
  }));

  it('should get login portfolios', fakeAsync(() => {
    const portfoliosMetaRes = [
      {
        portfolio: 'DtestPortfolio1',
        tks: 'testTks1',
        market: 'test Market1',
        agreement: 'testAgreement1',
      },
      {
        portfolio: 'GtestPortfolio2',
        tks: 'testTks2',
        market: 'test Market2',
        agreement: 'testAgreement2',
      },
      {
        portfolio: '1234',
        tks: 'testTks3',
        market: 'test Market3',
        agreement: 'testAgreement3',
      },
      {
        portfolio: 'DtestPortfolio4',
        tks: 'testTks4',
        market: 'test Market4',
        agreement: 'testAgreement4',
      },
    ];
    spyAuth.currentUser$ = of({ clientId: 'testClientId' });

    const expectedPortfolios = [
      {...portfoliosMetaRes[0], market: 'test', exchange: 'testExchange1', marketType: MarketType.Stock},
      {...portfoliosMetaRes[1], market: 'test', exchange: 'testExchange2', marketType: MarketType.ForeignExchange},
      {...portfoliosMetaRes[2], market: 'test', exchange: 'testExchange3', marketType: MarketType.Forward}
    ];

    service.getLoginPortfolios()
      .subscribe(res => expect(res).toEqual(expectedPortfolios));

    tick();

    const req = httpTestingController.expectOne(`${environment.clientDataUrl}/client/v1.0/users/testClientId/all-portfolios`);
    expect(req.request.method).toEqual('GET');
    req.flush(portfoliosMetaRes);
  }));
});
