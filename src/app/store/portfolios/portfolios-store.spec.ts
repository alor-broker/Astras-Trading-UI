import {
  Store,
  StoreModule
} from "@ngrx/store";
import { MarketType } from "../../shared/models/portfolio-key.model";
import { TestBed } from "@angular/core/testing";
import {
  BehaviorSubject,
  take
} from "rxjs";
import { AccountService } from '../../shared/services/account.service';
import { PortfolioExtended } from '../../shared/models/user/portfolio-extended.model';
import { ErrorHandlerService } from '../../shared/services/handle-error/error-handler.service';
import { PortfoliosInternalActions } from './portfolios.actions';
import { PortfoliosFeature } from "./portfolios.reducer";
import { GlobalLoadingIndicatorService } from "../../shared/services/global-loading-indicator.service";
import { EffectsModule } from "@ngrx/effects";
import { PortfoliosEffects } from "./portfolios.effects";

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
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(PortfoliosFeature),
        EffectsModule.forFeature([
          PortfoliosEffects
        ])
      ],
      providers: [
        { provide: AccountService, useValue: accountServiceSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerServiceSpy },
        {
          provide: GlobalLoadingIndicatorService,
          useValue: {
            registerLoading: jasmine.createSpy('registerLoading').and.callThrough(),
            releaseLoading: jasmine.createSpy('releaseLoading').and.callThrough()
          }
        }
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
