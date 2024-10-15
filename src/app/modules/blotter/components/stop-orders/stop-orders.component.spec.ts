import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { StopOrdersComponent } from './stop-orders.component';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { of, Subject } from 'rxjs';
import { TimezoneConverter } from '../../../../shared/utils/timezone-converter';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrdersGroupService } from "../../../../shared/services/orders/orders-group.service";
import { OrdersDialogService } from "../../../../shared/services/orders/orders-dialog.service";
import { LetDirective } from "@ngrx/component";
import { WsOrdersService } from "../../../../shared/services/orders/ws-orders.service";
import { NzContextMenuService } from "ng-zorro-antd/dropdown";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

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
    const timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
    timezoneConverterServiceSpy.getConverter.and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime)));

    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock))
          }
        },
        { provide: BlotterService, useClass: MockServiceBlotter },
        {
          provide: WsOrdersService,
          useValue: {
            cancelOrders: jasmine.createSpy('cancelOrders').and.returnValue(new Subject())
          }
        },
        { provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy },
        {
          provide: OrdersGroupService,
          useValue: {
            getAllOrderGroups: jasmine.createSpy('getAllOrderGroups').and.returnValue(new Subject())
          }
        },
        {
          provide: OrdersDialogService,
          useValue: {
            openEditOrderDialog: jasmine.createSpy('openEditOrderDialog').and.callThrough()
          }
        },
        {
          provide: NzContextMenuService,
          useValue: {
            create: jasmine.createSpy('create').and.callThrough(),
            close: jasmine.createSpy('close').and.callThrough()
          }
        },
        ...commonTestProviders
      ],
      declarations: [
        StopOrdersComponent,
        ComponentHelpers.mockComponent({ selector: 'ats-table-filter', inputs: ['columns'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-instrument-badge-display', inputs: ['columns'] }),
        ComponentHelpers.mockComponent({
          selector: 'ats-add-to-watchlist-menu'
        })
      ]
    }).compileComponents();
  });

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    fixture = TestBed.createComponent(StopOrdersComponent);
    component = fixture.componentInstance;
    component.guid = 'testGuid';
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
