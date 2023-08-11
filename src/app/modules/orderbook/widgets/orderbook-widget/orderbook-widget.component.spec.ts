import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrderbookWidgetComponent } from './orderbook-widget.component';
import {
  mockComponent,
  widgetSkeletonMock
} from "../../../../shared/utils/testing";
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";

describe('OrderbookWidgetComponent', () => {
  let component: OrderbookWidgetComponent;
  let fixture: ComponentFixture<OrderbookWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OrderbookWidgetComponent,
        mockComponent({
          selector: 'ats-order-book',
          inputs: ['guid']
        }),
        mockComponent({
          selector: 'ats-orderbook-settings',
          inputs: ['guid']
        }),
        widgetSkeletonMock
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(of(null)),
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            addSettings: jasmine.createSpy('addSettings').and.callThrough()
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            terminalSettingsService: of({})
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: of({})
          }
        }
      ]
    }).compileComponents();

    TestBed.overrideComponent(OrderbookWidgetComponent, {
      set: {
        providers: []
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookWidgetComponent);
    component = fixture.componentInstance;

    component.widgetInstance = {
      instance: {
        guid: 'guid'
      } as Widget,
      widgetMeta: {} as WidgetMeta
    };
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
