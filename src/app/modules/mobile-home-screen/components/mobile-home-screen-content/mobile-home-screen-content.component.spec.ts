import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileHomeScreenContentComponent } from './mobile-home-screen-content.component';
import { MockComponents, MockProvider } from "ng-mocks";
import { PortfolioDynamicsComponent } from "../portfolio-dynamics/portfolio-dynamics.component";
import { PositionsComponent } from "../positions/positions.component";
import { MarketTrendsComponent } from "../market-trends/market-trends.component";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { EMPTY } from 'rxjs';

describe('MobileHomeScreenContentComponent', () => {
  let component: MobileHomeScreenContentComponent;
  let fixture: ComponentFixture<MobileHomeScreenContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockComponents(
          PortfolioDynamicsComponent,
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
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileHomeScreenContentComponent);
    component = fixture.componentInstance;
    component.guid = 'test-guid';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
