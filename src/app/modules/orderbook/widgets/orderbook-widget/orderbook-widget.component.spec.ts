import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OrderbookWidgetComponent} from './orderbook-widget.component';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {of} from 'rxjs';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {MockComponents} from "ng-mocks";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {
  WidgetHeaderInstrumentSwitchComponent
} from "../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component";
import {OrderBookComponent} from "../../components/orderbook/orderbook.component";
import {OrderbookSettingsComponent} from "../../components/orderbook-settings/orderbook-settings.component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";

describe('OrderbookWidgetComponent', () => {
  let component: OrderbookWidgetComponent;
  let fixture: ComponentFixture<OrderbookWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrderbookWidgetComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          WidgetSkeletonComponent,
          WidgetHeaderComponent,
          WidgetHeaderInstrumentSwitchComponent,
          OrderBookComponent,
          OrderbookSettingsComponent,
        )
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

    fixture.componentRef.setInput(
      'widgetInstance',
      {
        instance: {
          guid: 'guid'
        } as Widget,
        widgetMeta: {widgetName: {}} as WidgetMeta
      }
    );

    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
