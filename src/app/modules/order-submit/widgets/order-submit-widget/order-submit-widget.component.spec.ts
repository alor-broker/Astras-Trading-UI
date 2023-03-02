import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrderSubmitWidgetComponent } from './order-submit-widget.component';
import {
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests,
  widgetSkeletonMock
} from '../../../../shared/utils/testing';
import { OrderSubmitModule } from '../../order-submit.module';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import {
  of,
  Subject
} from 'rxjs';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { InstrumentsService } from '../../../instruments/services/instruments.service';

describe('OrderSubmitWidgetComponent', () => {
  let component: OrderSubmitWidgetComponent;
  let fixture: ComponentFixture<OrderSubmitWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrderSubmitModule,
        ...sharedModuleImportForTests,
        getTranslocoModule()
      ],
      declarations: [
        mockComponent({
          selector: 'ats-widget-header',
          inputs: ['guid']
        }),
        mockComponent({
          selector: 'ats-order-submit',
          inputs: ['guid']
        }),
        mockComponent({
          selector: 'ats-order-submit-settings',
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
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: new Subject(),
            selectedPortfolio$: new Subject(),
            selectedDashboard$: new Subject()
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: jasmine.createSpy('getInstrument').and.returnValue(of({})),
          }
        },
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderSubmitWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
