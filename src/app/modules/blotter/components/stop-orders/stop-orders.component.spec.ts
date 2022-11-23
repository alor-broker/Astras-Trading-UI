import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalService } from 'src/app/shared/services/modal.service';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { StopOrdersComponent } from './stop-orders.component';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { of } from 'rxjs';
import { TimezoneConverter } from '../../../../shared/utils/timezone-converter';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { mockComponent, ngZorroMockComponents, sharedModuleImportForTests } from "../../../../shared/utils/testing";

describe('StopOrdersComponent', () => {
  let component: StopOrdersComponent;
  let fixture: ComponentFixture<StopOrdersComponent>;
  const settingsMock = {
    exchange: 'MOEX',
    portfolio: 'D39004',
    guid: '1230',
    ordersColumns: ['ticker'],
    tradesColumns: ['ticker'],
    positionsColumns: ['ticker'],
  };

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
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock))
          }
        },
        { provide: BlotterService, useClass: MockServiceBlotter },
        { provide: ModalService, useValue: modalSpy },
        { provide: OrderCancellerService, useValue: cancelSpy },
        { provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy },
      ],
      declarations: [
        StopOrdersComponent,
        mockComponent({ selector: 'ats-table-filter', inputs: ['columns'] })
      ]
    }).compileComponents();
  });

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    fixture = TestBed.createComponent(StopOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
