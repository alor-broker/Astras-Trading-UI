import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalService } from 'src/app/shared/services/modal.service';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { OrdersComponent } from './orders.component';
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { of } from 'rxjs';
import { TimezoneConverter } from '../../../../shared/utils/timezone-converter';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    const modalSpy = jasmine.createSpyObj('ModalService', ['closeCommandModal']);
    const cancelSpy = jasmine.createSpyObj('OrderCancellerService', ['cancelOrder']);
    const timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
    timezoneConverterServiceSpy.getConverter.and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime)));

    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        { provide: BlotterService, useClass: MockServiceBlotter },
        { provide: ModalService, useValue: modalSpy },
        { provide: OrderCancellerService, useValue: cancelSpy },
        { provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy },
      ],
      declarations: [OrdersComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
