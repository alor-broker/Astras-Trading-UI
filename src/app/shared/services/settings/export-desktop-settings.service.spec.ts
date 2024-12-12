import { TestBed } from '@angular/core/testing';
import { ExportDesktopSettingsService } from './export-desktop-settings.service';
import { MockProvider } from "ng-mocks";
import { TerminalSettingsService } from "../terminal-settings.service";
import { WidgetSettingsService } from "../widget-settings.service";
import { ManageDashboardsService } from "../manage-dashboards.service";
import { USER_CONTEXT } from "../auth/user-context";
import { of } from 'rxjs';
import { User } from "../../models/user/user.model";
import { TerminalSettings } from "../../models/terminal-settings/terminal-settings.model";
import { WidgetSettings } from "../../models/widget-settings.model";
import { GuidGenerator } from "../../utils/guid";
import { Dashboard } from "../../models/dashboard/dashboard.model";

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
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2024-12-11T10:32:30Z'));

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

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export settings to file with correct format and filename', (done) => {
    const expectedTimestamp = Date.now();
    const expectedFilename = `ASTRAS_DESKTOP_${expectedTimestamp}`;
    const expectedContent = {
      login: mockUser.login,
      terminalSettings: mockTerminalSettings,
      widgetSettings: mockWidgetSettings,
      dashboardSettings: mockDashboards
    };

    service.exportToFile().subscribe(result => {
      expect(result.filename).toBe(expectedFilename);
      expect(JSON.parse(result.content)).toEqual(expectedContent);
      done();
    });
  });

  it('should complete after single emission', (done) => {
    let emissionCount = 0;

    service.exportToFile().subscribe({
      next: () => emissionCount++,
      complete: () => {
        expect(emissionCount).toBe(1);
        done();
      }
    });
  });

  it('should properly format JSON content with indentation', (done) => {
    service.exportToFile().subscribe(result => {
      const formattedJson = JSON.stringify({
        login: mockUser.login,
        terminalSettings: mockTerminalSettings,
        widgetSettings: mockWidgetSettings,
        dashboardSettings: mockDashboards
      }, null, 4);

      expect(result.content).toBe(formattedJson);
      done();
    });
  });
});
