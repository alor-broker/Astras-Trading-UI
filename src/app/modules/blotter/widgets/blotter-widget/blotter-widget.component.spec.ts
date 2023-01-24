import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';

import { BlotterWidgetComponent } from './blotter-widget.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import {
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents,
  widgetSkeletonMock
} from "../../../../shared/utils/testing";
import { Store } from "@ngrx/store";
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';

describe('BlotterWidgetComponent', () => {
  let component: BlotterWidgetComponent;
  let fixture: ComponentFixture<BlotterWidgetComponent>;

  let widgetSettingsServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    widgetSettingsServiceSpy = jasmine.createSpyObj('WidgetSettingsService', ['getSettings', 'getSettingsOrNull', 'addSettings']);
    widgetSettingsServiceSpy.getSettings.and.returnValue(of({ activeTabIndex: 0 } as BlotterSettings));
    widgetSettingsServiceSpy.getSettingsOrNull.and.returnValue(of(null));
    widgetSettingsServiceSpy.addSettings.and.callThrough();

    await TestBed.configureTestingModule({
      declarations: [
        BlotterWidgetComponent,
        mockComponent({ selector: 'ats-positions', inputs: ['shouldShowSettings', 'guid'] }),
        mockComponent({ selector: 'ats-orders', inputs: ['shouldShowSettings', 'guid'] }),
        mockComponent({ selector: 'ats-stop-orders', inputs: ['shouldShowSettings', 'guid'] }),
        mockComponent({ selector: 'ats-trades', inputs: ['shouldShowSettings', 'guid'] }),
        ...ngZorroMockComponents,
        widgetSkeletonMock
      ],
      imports: [
        getTranslocoModule()
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettingsOrNull: of(null),
            getSettings: of({}),
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
            selectedPortfolio$: of({})
          }
        },
      ]
    }).compileComponents();

    TestBed.overrideComponent(BlotterWidgetComponent, {
      set: {
        providers: [
          { provide: WidgetSettingsService, useValue: widgetSettingsServiceSpy },
          {
            provide: Store,
            useValue: {
              select: jasmine.createSpy('select').and.returnValue(of({}))
            }
          }
        ]
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlotterWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
