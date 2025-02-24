import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PositionsComponent } from './positions.component';
import {MockProvider} from "ng-mocks";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {EMPTY} from "rxjs";
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {ACTIONS_CONTEXT} from "../../../../shared/services/actions-context";

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
        ),
        MockProvider(
          ACTIONS_CONTEXT,
          {
            selectInstrument: jasmine.createSpy('selectInstrument').and.callThrough(),
            openChart: jasmine.createSpy('selectInstrument').and.callThrough(),
          }
        ),
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
