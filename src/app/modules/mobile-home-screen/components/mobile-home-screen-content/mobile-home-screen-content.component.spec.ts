import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { MobileHomeScreenContentComponent } from './mobile-home-screen-content.component';
import {
  MockComponents,
  MockProvider
} from "ng-mocks";
import { PositionsComponent } from "../positions/positions.component";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { EMPTY } from 'rxjs';
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { NavigationStackService } from "../../../../shared/services/navigation-stack.service";
import { UserPortfoliosService } from "../../../../shared/services/user-portfolios.service";
import { AgreementDynamicsComponent } from "../../../portfolio-charts/components/agreement-dynamics/agreement-dynamics.component";
import { MarketTrendsComponent } from "../../../market-trends/components/market-trends/market-trends.component";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('MobileHomeScreenContentComponent', () => {
  let component: MobileHomeScreenContentComponent;
  let fixture: ComponentFixture<MobileHomeScreenContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockComponents(
          AgreementDynamicsComponent,
          PositionsComponent,
          MarketTrendsComponent
        ),
        MobileHomeScreenContentComponent
      ],
      providers: [
        MockProvider(
          WidgetSettingsService,
          {
            getSettings: () => EMPTY,
          }
        ),
        MockProvider(
          DashboardContextService,
          {
            selectDashboardInstrument: jasmine.createSpy('selectDashboardInstrument').and.callThrough()
          }
        ),
        MockProvider(NavigationStackService),
        MockProvider(
          UserPortfoliosService,
          {
            getPortfolios: () => EMPTY
          }
        ),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MobileHomeScreenContentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
