import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimitOrderPriceChangeComponent } from './limit-order-price-change.component';
import {Subject} from "rxjs";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import { WsOrdersService } from "../../../../shared/services/orders/ws-orders.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";

describe('LimitOrderPriceChangeComponent', () => {
  let component: LimitOrderPriceChangeComponent;
  let fixture: ComponentFixture<LimitOrderPriceChangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
      declarations: [
        LimitOrderPriceChangeComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: PortfolioSubscriptionsService,
          useValue: {
            getOrdersSubscription: jasmine.createSpy('getOrdersSubscription').and.returnValue(new Subject())
          }
        },
        {
          provide: WsOrdersService,
          useValue: {
            getInstrumentPositionSubscription: jasmine.createSpy('submitLimitOrderEdit').and.returnValue(new Subject())
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LimitOrderPriceChangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
