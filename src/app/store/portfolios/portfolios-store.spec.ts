import { Store } from "@ngrx/store";
import { MarketType } from "../../shared/models/portfolio-key.model";
import { TestBed } from "@angular/core/testing";
import { sharedModuleImportForTests } from "../../shared/utils/testing";
import {
  getAllPortfolios,
  getSelectedPortfolioKey
} from "./portfolios.selectors";
import {
  BehaviorSubject, of,
  take
} from "rxjs";
import {
  initPortfolios,
  selectNewPortfolio
} from "./portfolios.actions";
import { LocalStorageService } from '../../shared/services/local-storage.service';
import { AccountService } from '../../shared/services/account.service';
import { PortfolioExtended } from '../../shared/models/user/portfolio-extended.model';
import { ErrorHandlerService } from '../../shared/services/handle-error/error-handler.service';
import { SavedPortfolioState } from './portfolios.effects';
import { MarketService } from "../../shared/services/market.service";

describe('Portfolios Store', () => {
  let store: Store;

  let accountServiceSpy: any;
  let localStorageServiceSpy: any;
  let errorHandlerServiceSpy: any;

  let loginPortfoliosMock = new BehaviorSubject<PortfolioExtended[]>([]);

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

  const portfolioStorageKey = 'portfolio';
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

    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem']);
    errorHandlerServiceSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        { provide: AccountService, useValue: accountServiceSpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerServiceSpy },
        {
          provide: MarketService,
          useValue: {
            getExchangeSettings: jasmine.createSpy('getExchangeSettings')
              .and.callFake(e => of(e === 'MOEX' ? {isDefault: true} : {}))
          }
        }
      ]
    });

    store = TestBed.inject(Store);
  });

  it('should load portfolios on init', (done) => {
    loginPortfoliosMock.next(expectedPortfolios);

    store.dispatch(initPortfolios());

    expect(accountServiceSpy.getLoginPortfolios).toHaveBeenCalled();
    store.select(getAllPortfolios).pipe(
      take(1)
    ).subscribe(portfolios => {
      done();
      expect(portfolios).toEqual(expectedPortfolios);
    });
  });

  it('default portfolio should be selected if no saved portfolio', (done) => {
    loginPortfoliosMock.next(expectedPortfolios);
    localStorageServiceSpy.getItem.and.returnValue(undefined);

    store.dispatch(initPortfolios());

    expect(localStorageServiceSpy.getItem).toHaveBeenCalledWith(portfolioStorageKey);

    store.select(getSelectedPortfolioKey).pipe(
      take(1)
    ).subscribe(portfolio => {
      done();
      expect(portfolio).toEqual(moexStockPortfolio);
    });
  });

  it('saved portfolio should be selected', (done) => {
    loginPortfoliosMock.next(expectedPortfolios);
    localStorageServiceSpy.getItem.and.returnValue({
      lastActivePortfolio: moexForeignExchangePortfolio
    } as SavedPortfolioState);

    store.dispatch(initPortfolios());

    expect(localStorageServiceSpy.getItem).toHaveBeenCalledWith(portfolioStorageKey);
    store.select(getSelectedPortfolioKey).pipe(
      take(1)
    ).subscribe(portfolio => {
      done();
      expect(portfolio).toEqual(moexForeignExchangePortfolio);
    });
  });

  it('correct portfolio should be returned after selection', (done) => {
    loginPortfoliosMock.next(expectedPortfolios);
    localStorageServiceSpy.getItem.and.returnValue({
      lastActivePortfolio: moexForeignExchangePortfolio
    } as SavedPortfolioState);

    store.dispatch(initPortfolios());

    store.dispatch(selectNewPortfolio({ portfolio: spbxStockPortfolio }));

    store.select(getSelectedPortfolioKey).pipe(
      take(1)
    ).subscribe(portfolio => {
      done();
      expect(portfolio).toEqual(spbxStockPortfolio);
    });
  });

  it('portfolio should be saved after selection', () => {
    loginPortfoliosMock.next(expectedPortfolios);
    localStorageServiceSpy.getItem.and.returnValue({
      lastActivePortfolio: moexForeignExchangePortfolio
    } as SavedPortfolioState);

    store.dispatch(initPortfolios());

    store.dispatch(selectNewPortfolio({ portfolio: spbxStockPortfolio }));

    expect(localStorageServiceSpy.setItem).toHaveBeenCalledWith(
      portfolioStorageKey,
      {
        lastActivePortfolio: spbxStockPortfolio
      } as SavedPortfolioState
    );
  });
});
