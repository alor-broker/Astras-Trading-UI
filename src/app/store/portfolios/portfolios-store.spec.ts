import { Store } from "@ngrx/store";
import { PortfolioKey } from "../../shared/models/portfolio-key.model";
import {
  fakeAsync,
  TestBed,
  tick
} from "@angular/core/testing";
import { sharedModuleImportForTests } from "../../shared/utils/testing";
import { getSelectedPortfolio } from "./portfolios.selectors";
import { take } from "rxjs";
import { selectNewPortfolio } from "./portfolios.actions";

describe('Portfolios Store', () => {
  let store: Store;

  const expectedPortfolioKey: PortfolioKey = {
    portfolio: 'D1234',
    exchange: 'SPBX'
  };

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ]
    });

    store = TestBed.inject(Store);
  });

  it('portfolio should NOT be selected by default', (done) => {
    store.select(getSelectedPortfolio).pipe(
      take(1)
    ).subscribe(portfolio => {
      done();
      expect(portfolio).toBeNull();
    });
  });

  it('correct portfolio should be returned after selection', fakeAsync(() => {
    store.select(getSelectedPortfolio).pipe(
      take(1)
    ).subscribe(portfolio => {
      expect(portfolio).toBeNull();
    });

    tick();

    store.dispatch(selectNewPortfolio({portfolio: expectedPortfolioKey}));

    tick();

    store.select(getSelectedPortfolio).pipe(
      take(1)
    ).subscribe(portfolio => {
      expect(portfolio).toEqual(expectedPortfolioKey);
    });
  }));
});
