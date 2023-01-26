import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { TechChartWidgetComponent } from './tech-chart-widget.component';
import {
  mockComponent,
  widgetSkeletonMock
} from "../../../../shared/utils/testing";
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { InstrumentsService } from '../../../instruments/services/instruments.service';

describe('TechChartWidgetComponent', () => {
  let component: TechChartWidgetComponent;
  let fixture: ComponentFixture<TechChartWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TechChartWidgetComponent,
        mockComponent({
          selector: 'ats-tech-chart',
          inputs: ['guid']
        }),
        mockComponent({
          selector: 'ats-tech-chart-settings',
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
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: of({})
          }
        },
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TechChartWidgetComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
