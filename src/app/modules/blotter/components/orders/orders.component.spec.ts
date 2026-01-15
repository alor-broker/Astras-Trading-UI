import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BlotterService} from '../../services/blotter.service';
import {MockServiceBlotter} from '../../utils/mock-blotter-service';

import {OrdersComponent} from './orders.component';
import {TimezoneConverterService} from '../../../../shared/services/timezone-converter.service';
import {EMPTY, Observable, of, Subject} from 'rxjs';
import {TimezoneConverter} from '../../../../shared/utils/timezone-converter';
import {TimezoneDisplayOption} from '../../../../shared/models/enums/timezone-display-option';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {OrdersGroupService} from "../../../../shared/services/orders/orders-group.service";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import {LetDirective} from "@ngrx/component";
import {NzContextMenuService, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {ORDER_COMMAND_SERVICE_TOKEN,} from "../../../../shared/services/orders/order-command.service";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {
  NzFilterTriggerComponent,
  NzTableCellDirective,
  NzTableComponent,
  NzTableVirtualScrollDirective,
  NzTbodyComponent,
  NzThAddOnComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from "ng-zorro-antd/table";
import {TableRowHeightDirective} from "../../../../shared/directives/table-row-height.directive";
import {NzPopconfirmDirective} from "ng-zorro-antd/popconfirm";
import {ResizeColumnDirective} from "../../../../shared/directives/resize-column.directive";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {
  InstrumentBadgeDisplayComponent
} from "../../../../shared/components/instrument-badge-display/instrument-badge-display.component";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {
  TableSearchFilterComponent
} from "../../../../shared/components/table-search-filter/table-search-filter.component";
import {
  AddToWatchlistMenuComponent
} from "../../../instruments/widgets/add-to-watchlist-menu/add-to-watchlist-menu.component";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    const timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
    timezoneConverterServiceSpy.getConverter.and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime)));
    const settingsMock = {
      exchange: 'MOEX',
      portfolio: 'D39004',
      guid: '1230',
      ordersColumns: ['ticker'],
      tradesColumns: ['ticker'],
      positionsColumns: ['ticker'],
    };

    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        OrdersComponent,
        MockComponents(
          NzEmptyComponent,
          NzTableComponent,
          NzTheadComponent,
          NzThAddOnComponent,
          NzFilterTriggerComponent,
          NzTbodyComponent,
          InstrumentBadgeDisplayComponent,
          NzButtonComponent,
          NzDropdownMenuComponent,
          TableSearchFilterComponent,
          AddToWatchlistMenuComponent
        ),
        MockDirectives(
          NzResizeObserverDirective,
          TableRowHeightDirective,
          NzTrDirective,
          NzTableCellDirective,
          NzThMeasureDirective,
          NzPopconfirmDirective,
          ResizeColumnDirective,
          NzTooltipDirective,
          NzIconDirective,
          NzTableVirtualScrollDirective,
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock))}
        },
        {provide: BlotterService, useClass: MockServiceBlotter},
        {
          provide: ORDER_COMMAND_SERVICE_TOKEN,
          useValue: {
            cancelOrders: jasmine.createSpy('cancelOrders').and.returnValue(new Subject())
          }
        },
        {provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy},
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
        {
          provide: WidgetLocalStateService,
          useValue: {
            getStateRecord: (): Observable<never> => EMPTY,
            setStateRecord: jasmine.createSpy('setStateRecord').and.callThrough()
          }
        },
        ...commonTestProviders
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
