import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { BlotterWidgetComponent } from './blotter-widget.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { Store } from "@ngrx/store";
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { BlotterSettings } from '../../models/blotter-settings.model';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";
import { widgetSkeletonMock } from "../../../../shared/utils/testing/widget-skeleton-mock";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import {PUSH_NOTIFICATIONS_CONFIG} from "../../../push-notifications/services/push-notifications-config";

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
        ComponentHelpers.mockComponent({ selector: 'ats-positions', inputs: ['guid'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-orders', inputs: ['guid'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-stop-orders', inputs: ['guid'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-trades', inputs: ['guid'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-trades-history', inputs: ['guid'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-repo-trades', inputs: ['guid'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-orders-group-modal-widget', inputs: ['guid'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-push-notifications', inputs: ['guid'] }),
        ...ngZorroMockComponents,
        widgetSkeletonMock
      ],
      imports: [
        TranslocoTestsModule.getModule()
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
        {
          provide: PUSH_NOTIFICATIONS_CONFIG,
          useValue: {
            priceChangeNotifications: {
              isSupported: true
            },
            portfolioOrdersExecuteNotifications: {
              isSupported: true
            }
          }
        }
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

    component.widgetInstance = {
      instance: {
        guid: 'guid'
      } as Widget,
      widgetMeta: {} as WidgetMeta
    };
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
