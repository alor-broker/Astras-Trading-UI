import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrderbookSettingsComponent } from './orderbook-settings.component';
import {of, Subject} from 'rxjs';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  commonTestProviders,
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import {DeviceService} from "../../../../shared/services/device.service";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";

describe('OrderbookSettingsComponent', () => {
  let component: OrderbookSettingsComponent;
  let fixture: ComponentFixture<OrderbookSettingsComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach((async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OrderbookSettingsComponent,
        mockComponent({ selector: 'ats-instrument-board-select', inputs: ['instrument', 'placeholder'] })
      ],
      imports: [
        NoopAnimationsModule,
        ...sharedModuleImportForTests,
        getTranslocoModule()
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
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
