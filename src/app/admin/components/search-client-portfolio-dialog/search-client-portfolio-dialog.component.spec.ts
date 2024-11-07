import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SearchClientPortfolioDialogComponent} from './search-client-portfolio-dialog.component';
import {MockProvider} from "ng-mocks";
import {MarketService} from "../../../shared/services/market.service";
import {ClientPortfolioSearchService} from "../../services/portfolio/client-portfolio-search.service";
import {EMPTY} from "rxjs";
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";

describe('SearchClientPortfolioDialogComponent', () => {
  let component: SearchClientPortfolioDialogComponent;
  let fixture: ComponentFixture<SearchClientPortfolioDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SearchClientPortfolioDialogComponent,
        TranslocoTestsModule.getModule(),
      ],
      providers: [
        MockProvider(
          MarketService,
          {
            getAllExchanges: () => EMPTY
          }
        ),
        MockProvider(ClientPortfolioSearchService)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SearchClientPortfolioDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
