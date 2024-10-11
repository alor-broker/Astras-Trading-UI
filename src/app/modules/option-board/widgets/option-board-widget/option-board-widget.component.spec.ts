import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OptionBoardWidgetComponent } from './option-board-widget.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  of,
  Subject
} from "rxjs";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { LOGGER } from "../../../../shared/services/logging/logger-base";
import { Widget } from "../../../../shared/models/dashboard/widget.model";
import { WidgetMeta } from "../../../../shared/models/widget-meta.model";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { widgetSkeletonMock } from "../../../../shared/utils/testing/widget-skeleton-mock";

describe('OptionBoardWidgetComponent', () => {
  let component: OptionBoardWidgetComponent;
  let fixture: ComponentFixture<OptionBoardWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OptionBoardWidgetComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-widget-header',
          inputs: ['guid']
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-option-board',
          inputs: ['guid']
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-option-board-settings',
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
          provide: LOGGER,
          useValue: []
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OptionBoardWidgetComponent);
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
