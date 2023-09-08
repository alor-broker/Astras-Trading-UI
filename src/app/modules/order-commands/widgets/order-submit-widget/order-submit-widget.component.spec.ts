import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderSubmitWidgetComponent } from './order-submit-widget.component';
import {QuotesService} from "../../../../shared/services/quotes.service";
import {Subject} from "rxjs";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {CommonParametersService} from "../../services/common-parameters.service";
import {WidgetsDataProviderService} from "../../../../shared/services/widgets-data-provider.service";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";

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
          provide: WidgetsDataProviderService,
          useValue: {
            getDataProvider: jasmine.createSpy('getDataProvider').and.returnValue(new Subject())
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
