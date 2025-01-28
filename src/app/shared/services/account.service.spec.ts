import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { AccountService } from './account.service';
import { of } from "rxjs";
import { MarketType } from "../models/portfolio-key.model";
import { EnvironmentService } from "./environment.service";
import { PortfolioMeta } from "../models/user/portfolio-meta.model";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { USER_CONTEXT } from "./auth/user-context";
import {MockProvider} from "ng-mocks";
import {ErrorHandlerService} from "./handle-error/error-handler.service";

describe('AccountService', () => {
  let service: AccountService;
  const spyUserContext = jasmine.createSpyObj('USER_CONTEXT', ['getUser']);
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

  const clientDataUrl = 'clientDataUrl';

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
      AccountService,
      MockProvider(
        EnvironmentService,
        {
          clientDataUrl
        }
      ),
      MockProvider(
        USER_CONTEXT,
        spyUserContext
      ),
      MockProvider(
        PositionsService,
        spyPositions
      ),
      MockProvider(ErrorHandlerService),
      provideHttpClient(withInterceptorsFromDi()),
      provideHttpClientTesting()
    ]
});

    service = TestBed.inject(AccountService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get full name', fakeAsync(() => {
    spyUserContext.getUser.and.returnValue(of({ login: 'testLogin' }));

    const fullNameRes = {
      firstName: 'firstNameTest',
      lastName: 'lastNameTest',
      secondName: 'secondNameTest'
    };

    service.getFullName()
      .subscribe(res => expect(res).toEqual(fullNameRes));
    tick();

    const req = httpTestingController.expectOne(`${clientDataUrl}/client/v1.0/users/testLogin/full-name`);

    expect(req.request.method).toEqual('GET');

    req.flush(fullNameRes);
  }));

  it('should get login portfolios', fakeAsync(() => {
    const portfoliosMetaRes: PortfolioMeta[] = [
      {
        portfolio: 'DtestPortfolio1',
        tks: 'testTks1',
        market: 'test Market1',
        agreement: 'testAgreement1',
        isVirtual: false
      },
      {
        portfolio: 'GtestPortfolio2',
        tks: 'testTks2',
        market: 'test Market2',
        agreement: 'testAgreement2',
        isVirtual: false
      },
      {
        portfolio: '1234',
        tks: 'testTks3',
        market: 'test Market3',
        agreement: 'testAgreement3',
        isVirtual: false
      },
      {
        portfolio: 'DtestPortfolio4',
        tks: 'testTks4',
        market: 'test Market4',
        agreement: 'testAgreement4',
        isVirtual: false
      },
    ];

    spyUserContext.getUser.and.returnValue(of({ clientId: 'testClientId' }));

    const expectedPortfolios = [
      {...portfoliosMetaRes[0], market: 'test', exchange: 'testExchange1', marketType: MarketType.Stock },
      {...portfoliosMetaRes[1], market: 'test', exchange: 'testExchange2', marketType: MarketType.ForeignExchange },
      {...portfoliosMetaRes[2], market: 'test', exchange: 'testExchange3', marketType: MarketType.Forward }
    ];

    service.getLoginPortfolios()
      .subscribe(res => expect(res).toEqual(expectedPortfolios));

    tick();

    const req = httpTestingController.expectOne(`${clientDataUrl}/client/v1.0/users/testClientId/all-portfolios`);
    expect(req.request.method).toEqual('GET');
    req.flush(portfoliosMetaRes);
  }));
});
