import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderSubmitWidgetComponent } from './order-submit-widget.component';
import {Subject} from "rxjs";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {CommonParametersService} from "../../services/common-parameters.service";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import { WidgetsSharedDataService } from "../../../../shared/services/widgets-shared-data.service";
import { ORDER_COMMAND_SERVICE_TOKEN } from "../../../../shared/services/orders/order-command.service";

describe('OrderSubmitWidgetComponent', () => {
  let component: OrderSubmitWidgetComponent;
  let fixture: ComponentFixture<OrderSubmitWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrderSubmitWidgetComponent],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings ').and.returnValue(new Subject()),
            getSettingsOrNull: jasmine.createSpy('getSettingsOrNull ').and.returnValue(new Subject())
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedPortfolio$: new Subject(),
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: jasmine.createSpy('getInstrument').and.returnValue(new Subject())
          }
        },
        {
          provide: CommonParametersService,
          useValue: {
            setParameters: jasmine.createSpy('setParameters').and.callThrough()
          }
        },
        {
          provide: WidgetsSharedDataService,
          useValue: {
            getDataProvideValues: jasmine.createSpy('getDataProvideValues').and.returnValue(new Subject())
          }
        },
        {
          provide: ORDER_COMMAND_SERVICE_TOKEN,
          useValue: {
            getOrdersConfig: jasmine.createSpy('getOrdersConfig').and.returnValue({ })
          }
        }
      ]
    });
    fixture = TestBed.createComponent(OrderSubmitWidgetComponent);
    component = fixture.componentInstance;

    component.widgetInstance = {
      instance: {
        guid: 'guid'
      } as Widget,
      widgetMeta: {} as WidgetMeta
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
