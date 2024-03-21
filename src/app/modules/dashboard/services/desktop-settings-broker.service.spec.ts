import { TestBed } from '@angular/core/testing';

import { DesktopSettingsBrokerService } from './desktop-settings-broker.service';
import {commonTestProviders, sharedModuleImportForTests} from "../../../shared/utils/testing";
import {
  DashboardSettingsBrokerService
} from "../../../shared/services/settings-broker/dashboard-settings-broker.service";
import {Subject} from "rxjs";
import {ManageDashboardsService} from "../../../shared/services/manage-dashboards.service";
import {WidgetsSettingsBrokerService} from "../../../shared/services/settings-broker/widgets-settings-broker.service";
import {WidgetSettingsService} from "../../../shared/services/widget-settings.service";
import {TerminalSettingsBrokerService} from "../../../shared/services/settings-broker/terminal-settings-broker.service";
import {TerminalSettingsService} from "../../../shared/services/terminal-settings.service";
import { GlobalLoadingIndicatorService } from "../../../shared/services/global-loading-indicator.service";

describe('DesktopSettingsBrokerService', () => {
  let service: DesktopSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers: [
        {
          provide: DashboardSettingsBrokerService,
          useValue: {
            saveSettings: jasmine.createSpy('saveSettings').and.returnValue(new Subject()),
            readSettings: jasmine.createSpy('readSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            allDashboards$: new Subject()
          }
        },
        {
          provide: WidgetsSettingsBrokerService,
          useValue: {
            removeSettings: jasmine.createSpy('removeSettings').and.returnValue(new Subject()),
            readSettings: jasmine.createSpy('readSettings').and.returnValue(new Subject()),
            saveSettings: jasmine.createSpy('saveSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: WidgetSettingsService,
          useValue: {
            getAllSettings: jasmine.createSpy('getAllSettings').and.returnValue(new Subject()),
          }
        },
        {
          provide: TerminalSettingsBrokerService,
          useValue: {
            readSettings: jasmine.createSpy('readSettings').and.returnValue(new Subject()),
            saveSettings: jasmine.createSpy('saveSettings').and.returnValue(new Subject()),
            removeSettings: jasmine.createSpy('removeSettings').and.returnValue(new Subject()),
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject()),
          }
        },
        {
          provide: GlobalLoadingIndicatorService,
          useValue: {
            isLoading$: new Subject(),
            registerLoading: jasmine.createSpy('registerLoading').and.callThrough(),
            releaseLoading: jasmine.createSpy('releaseLoading').and.callThrough(),
          }
        },
        ...commonTestProviders
      ]
    });
    service = TestBed.inject(DesktopSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
