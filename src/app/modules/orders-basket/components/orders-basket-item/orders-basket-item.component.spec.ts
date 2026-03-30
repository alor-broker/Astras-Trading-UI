import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';

import {OrdersBasketItemComponent} from './orders-basket-item.component';
import {InstrumentsService} from '../../../instruments/services/instruments.service';
import {of} from 'rxjs';
import {QuotesService} from '../../../../shared/services/quotes.service';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {InputNumberComponent} from "../../../../shared/components/input-number/input-number.component";
import {InstrumentSearchComponent} from "../../../../shared/components/instrument-search/instrument-search.component";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('OrdersBasketItemComponent', () => {
  let component: OrdersBasketItemComponent;
  let fixture: ComponentFixture<OrdersBasketItemComponent>;

  const instrumentsServiceMock = jasmine.createSpyObj(['getInstrument']);
  const quotesServiceMock = jasmine.createSpyObj(['getLastPrice']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrdersBasketItemComponent,
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        MockComponents(
          InstrumentSearchComponent,
          InputNumberComponent,
          NzButtonComponent
        ),
        MockDirectives(
          NzIconDirective
        )
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
    fixture.componentRef.setInput('exchange', 'exch');
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
