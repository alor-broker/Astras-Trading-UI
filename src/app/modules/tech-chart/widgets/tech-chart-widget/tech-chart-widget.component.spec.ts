import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { TechChartWidgetComponent } from './tech-chart-widget.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import {
  EMPTY,
  of
} from 'rxjs';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { ThemeService } from "../../../../shared/services/theme.service";
import { widgetSkeletonMock } from "../../../../shared/utils/testing/widget-skeleton-mock";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('TechChartWidgetComponent', () => {
  let component: TechChartWidgetComponent;
  let fixture: ComponentFixture<TechChartWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TechChartWidgetComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-tech-chart',
          inputs: ['guid']
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-tech-chart-settings',
          inputs: ['guid']
        }),
        ComponentHelpers.mockComponent({ selector: 'ats-instrument-search-modal' }),
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
          provide: ThemeService,
          useValue: {
            getThemeSettings: jasmine.createSpy('getThemeSettings').and.returnValue(EMPTY)
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TechChartWidgetComponent);
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
