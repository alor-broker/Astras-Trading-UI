import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersBasketItemComponent } from './orders-basket-item.component';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import {
  Subject
} from 'rxjs';
import { QuotesService } from '../../../../shared/services/quotes.service';
import {
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import { OrdersBasketModule } from '../../orders-basket.module';

describe('OrdersBasketItemComponent', () => {
  let component: OrdersBasketItemComponent;
  let fixture: ComponentFixture<OrdersBasketItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrdersBasketModule,
        ...sharedModuleImportForTests,
        getTranslocoModule()
      ],
      declarations: [
        OrdersBasketItemComponent,
        mockComponent({ selector: 'ats-instrument-search', inputs: ['exchange', 'optionsBoxWidth'] }),
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: jasmine.createSpy('getInstrument').and.returnValue(new Subject())
          }
        },
        {
          provide: QuotesService,
          useValue: {
            getInstrument: jasmine.createSpy('getLastPrice').and.returnValue(new Subject())
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersBasketItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
