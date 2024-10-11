import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { LightChartWidgetComponent } from './light-chart-widget.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { Widget } from "../../../../shared/models/dashboard/widget.model";
import { WidgetMeta } from "../../../../shared/models/widget-meta.model";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { widgetSkeletonMock } from "../../../../shared/utils/testing/widget-skeleton-mock";

describe('LightChartWidgetComponent', () => {
  let component: LightChartWidgetComponent;
  let fixture: ComponentFixture<LightChartWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        LightChartWidgetComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-light-chart',
          inputs: ['guid']
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-light-chart-settings',
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
    })
      .compileComponents();

    TestBed.overrideComponent(LightChartWidgetComponent, {
      set: {
        providers: []
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LightChartWidgetComponent);
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
