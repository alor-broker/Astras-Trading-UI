import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OrderbookSettingsComponent} from './orderbook-settings.component';
import {of, Subject} from 'rxjs';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DeviceService} from "../../../../shared/services/device.service";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";
import {MockComponents, MockDirectives} from "ng-mocks";
import {InstrumentSearchComponent} from "../../../../shared/components/instrument-search/instrument-search.component";
import {
  InstrumentBoardSelectComponent
} from "../../../../shared/components/instrument-board-select/instrument-board-select.component";
import {NzSliderComponent} from "ng-zorro-antd/slider";
import {NzSwitchComponent} from "ng-zorro-antd/switch";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzPopoverDirective} from "ng-zorro-antd/popover";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('OrderbookSettingsComponent', () => {
  let component: OrderbookSettingsComponent;
  let fixture: ComponentFixture<OrderbookSettingsComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        OrderbookSettingsComponent,
        MockComponents(
          WidgetSettingsComponent,
          InstrumentSearchComponent,
          InstrumentBoardSelectComponent,
          NzSliderComponent,
          NzSwitchComponent,
        ),
        MockDirectives(
          NzIconDirective,
          NzPopoverDirective,
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({
              symbol: 'SBER',
              exchange: 'MOEX'
            })),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        },
        {
          provide: DeviceService,
          useValue: {
            deviceInfo$: new Subject()
          }
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            copyWidget: jasmine.createSpy('copyWidget').and.callThrough(),
          }
        },
        ...commonTestProviders
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookSettingsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
