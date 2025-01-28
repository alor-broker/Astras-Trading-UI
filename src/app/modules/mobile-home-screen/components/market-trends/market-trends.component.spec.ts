import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketTrendsComponent } from './market-trends.component';
import {MockProvider} from "ng-mocks";
import {GraphQlService} from "../../../../shared/services/graph-ql.service";
import {EMPTY} from "rxjs";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";

describe('MarketTrendsComponent', () => {
  let component: MarketTrendsComponent;
  let fixture: ComponentFixture<MarketTrendsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MarketTrendsComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(
          GraphQlService,
          {
            watchQueryForSchema: () => EMPTY
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketTrendsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
