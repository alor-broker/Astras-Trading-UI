import { Store } from "@ngrx/store";
import { MarketType } from "../../shared/models/portfolio-key.model";
import { TestBed } from "@angular/core/testing";
import {
  commonTestProviders,
  sharedModuleImportForTests
} from "../../shared/utils/testing";
import {
  BehaviorSubject,
  of,
  take
} from "rxjs";
import { AccountService } from '../../shared/services/account.service';
import { PortfolioExtended } from '../../shared/models/user/portfolio-extended.model';
import { ErrorHandlerService } from '../../shared/services/handle-error/error-handler.service';
import { MarketService } from "../../shared/services/market.service";
import { PortfoliosInternalActions } from './portfolios.actions';
import { PortfoliosFeature } from "./portfolios.reducer";
import { EnvironmentService } from "../../shared/services/environment.service";

describe('Portfolios Store', () => {
  let store: Store;

  let accountServiceSpy: any;
  let errorHandlerServiceSpy: any;

  const loginPortfoliosMock = new BehaviorSubject<PortfolioExtended[]>([]);

  const spbxStockPortfolio = {
    portfolio: 'D1234',
    exchange: 'SPBX',
    marketType: MarketType.Stock
  } as PortfolioExtended;

  const moexStockPortfolio = {
    portfolio: 'D1234',
    exchange: 'MOEX',
    marketType: MarketType.Stock
  } as PortfolioExtended;

  const moexForeignExchangePortfolio = {
    portfolio: 'G1234',
    exchange: 'MOEX',
    marketType: MarketType.ForeignExchange
  } as PortfolioExtended;

  const moexForwardPortfolio = {
    portfolio: '1234',
    exchange: 'MOEX',
    marketType: MarketType.Forward
  } as PortfolioExtended;

  const expectedPortfolios = [
    spbxStockPortfolio,
    moexStockPortfolio,
    moexForeignExchangePortfolio,
    moexForwardPortfolio
  ];

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    accountServiceSpy = jasmine.createSpyObj('AccountService', ['getLoginPortfolios']);
    accountServiceSpy.getLoginPortfolios.and.returnValue(loginPortfoliosMock);

    errorHandlerServiceSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        { provide: AccountService, useValue: accountServiceSpy },
        {
          provide: EnvironmentService,
          useValue: {
            remoteSettingsStorageUrl : ''
          }
        },
        { provide: ErrorHandlerService, useValue: errorHandlerServiceSpy },
        {
          provide: MarketService,
          useValue: {
            getExchangeSettings: jasmine.createSpy('getExchangeSettings')
              .and.callFake(e => of(e === 'MOEX' ? { isDefault: true } : {}))
          }
        },
        ...commonTestProviders
      ]
    });

    store = TestBed.inject(Store);
  });

  it('should load portfolios on init', (done) => {
    loginPortfoliosMock.next(expectedPortfolios);

    store.dispatch(PortfoliosInternalActions.init());

    expect(accountServiceSpy.getLoginPortfolios).toHaveBeenCalled();
    store.select(PortfoliosFeature.selectPortfoliosState).pipe(
      take(1)
    ).subscribe(portfoliosState => {
      done();
      expect(Object.values(portfoliosState.entities).map(x => x!)).toEqual(expectedPortfolios);
    });
  });
});
