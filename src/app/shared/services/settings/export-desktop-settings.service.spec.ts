import {TestBed} from '@angular/core/testing';
import {ExportDesktopSettingsService} from './export-desktop-settings.service';
import {MockProvider} from "ng-mocks";
import {TerminalSettingsService} from "../terminal-settings.service";
import {WidgetSettingsService} from "../widget-settings.service";
import {ManageDashboardsService} from "../manage-dashboards.service";
import {USER_CONTEXT} from "../auth/user-context";
import {of} from 'rxjs';
import {User} from "../../models/user/user.model";
import {TerminalSettings} from "../../models/terminal-settings/terminal-settings.model";
import {WidgetSettings} from "../../models/widget-settings.model";
import {GuidGenerator} from "../../utils/guid";
import {Dashboard} from "../../models/dashboard/dashboard.model";

describe('ExportDesktopSettingsService', () => {
  let service: ExportDesktopSettingsService;

  const mockUser: User = {
    login: 'testUser',
    portfolios: []
  };

  const mockTerminalSettings: TerminalSettings = {
    language: 'ru'
  };

  const mockWidgetSettings: WidgetSettings[] = [
    {
      guid: GuidGenerator.newGuid()
    }
  ];

  const mockDashboards: Dashboard[] = [
    {
      guid: GuidGenerator.newGuid(),
      instrumentsSelection: {},
      items: [],
      title: 'Title',
      version: '1'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExportDesktopSettingsService,
        MockProvider(USER_CONTEXT, {
          getUser: () => of(mockUser)
        }),
        MockProvider(TerminalSettingsService, {
          getSettings: () => of(mockTerminalSettings)
        }),
        MockProvider(WidgetSettingsService, {
          getAllSettings: () => of(mockWidgetSettings)
        }),
        MockProvider(ManageDashboardsService, {
          allDashboards$: of(mockDashboards)
        })
      ]
    });

    service = TestBed.inject(ExportDesktopSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
