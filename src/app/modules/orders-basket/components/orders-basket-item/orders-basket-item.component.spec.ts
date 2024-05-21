import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { OrdersBasketItemComponent } from './orders-basket-item.component';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { of } from 'rxjs';
import { QuotesService } from '../../../../shared/services/quotes.service';
import {
  commonTestProviders,
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import { OrdersBasketModule } from '../../orders-basket.module';

describe('OrdersBasketItemComponent', () => {
  let component: OrdersBasketItemComponent;
  let fixture: ComponentFixture<OrdersBasketItemComponent>;

  const instrumentsServiceMock = jasmine.createSpyObj(['getInstrument']);
  const quotesServiceMock = jasmine.createSpyObj(['getLastPrice']);

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
          useValue: instrumentsServiceMock
        },
        {
          provide: QuotesService,
          useValue: quotesServiceMock
        },
        ...commonTestProviders
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

  it('should correctly validate form', fakeAsync(() => {
    const testInstrument = {
      symbol: 'SYMB',
      exchange: 'EXCH',
      minstep: 0.001
    };

    const validPrice = 1.234;
    const invalidPrice = 1.2345;

    instrumentsServiceMock.getInstrument.and.returnValue(of(testInstrument));
    quotesServiceMock.getLastPrice.and.returnValue(of(5.432));


    component.form.controls.price.setValue(invalidPrice);
    expect(component.form.controls.price.invalid).toBeFalse();

    component.form.controls.instrumentKey.setValue(testInstrument);
    tick();

    expect(component.form.controls.price.invalid).toBeTrue();

    component.form.controls.price.setValue(validPrice);
    expect(component.form.controls.price.invalid).toBeFalse();

    component.form.controls.price.setValue(invalidPrice);
    component.form.controls.instrumentKey.setValue(null);
    tick();

    expect(component.form.controls.price.invalid).toBeFalse();
  }));
});
