import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ExchangeRateComponent } from './exchange-rate.component';
import { ExchangeRateService } from "../../services/exchange-rate.service";
import { of } from "rxjs";
import { SubscriptionsDataFeedService } from '../../../../shared/services/subscriptions-data-feed.service';

describe('ExchangeRateComponent', () => {
  let component: ExchangeRateComponent;
  let fixture: ComponentFixture<ExchangeRateComponent>;

  let subscriptionsDataFeedServiceSpy: any;

  beforeEach(() => {
    subscriptionsDataFeedServiceSpy = jasmine.createSpyObj('SubscriptionsDataFeedService', ['subscribe']);
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExchangeRateComponent],
      providers: [
        {
          provide: ExchangeRateService,
          useValue: {
            getCurrencies: jasmine.createSpy('getCurrencies').and.returnValue(of([]))
          }
        },
        {
          provide: SubscriptionsDataFeedService,
          useValue: subscriptionsDataFeedServiceSpy
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExchangeRateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
