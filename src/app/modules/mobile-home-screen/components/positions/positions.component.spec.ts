import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PositionsComponent } from './positions.component';
import {MockProvider} from "ng-mocks";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {EMPTY} from "rxjs";
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";

describe('PositionsComponent', () => {
  let component: PositionsComponent;
  let fixture: ComponentFixture<PositionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PositionsComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(
          DashboardContextService,
          {
            selectedPortfolio$: EMPTY
          }
        ),
        MockProvider(
          UserPortfoliosService,
          {
            getPortfolios: () => EMPTY
          }
        ),
        MockProvider(
          PortfolioSubscriptionsService,
          {
            getAllPositionsSubscription: () => EMPTY
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PositionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
