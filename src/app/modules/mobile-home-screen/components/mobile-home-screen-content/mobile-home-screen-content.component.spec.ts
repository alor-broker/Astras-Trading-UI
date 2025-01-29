import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileHomeScreenContentComponent } from './mobile-home-screen-content.component';
import {MockComponents} from "ng-mocks";
import {PortfolioDynamicsComponent} from "../portfolio-dynamics/portfolio-dynamics.component";
import {PositionsComponent} from "../positions/positions.component";
import {MarketTrendsComponent} from "../market-trends/market-trends.component";

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
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileHomeScreenContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
