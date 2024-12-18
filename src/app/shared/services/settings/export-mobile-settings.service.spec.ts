import { TestBed } from '@angular/core/testing';
import { ExportMobileSettingsService } from './export-mobile-settings.service';
import {
  MockBuilder,
  MockInstance,
  MockProvider,
  MockReset
} from "ng-mocks";
import { USER_CONTEXT } from "../auth/user-context";
import { LocalStorageService } from "../local-storage.service";
import { of } from 'rxjs';
import { User } from "../../models/user/user.model";
import { TerminalSettings } from "../../models/terminal-settings/terminal-settings.model";
import { WidgetSettings } from "../../models/widget-settings.model";
import { GuidGenerator } from "../../utils/guid";
import { Dashboard } from "../../models/dashboard/dashboard.model";
import { LocalStorageMobileConstants } from "../../constants/local-storage.constants";
import { InstrumentKey } from "../../models/instruments/instrument-key.model";

describe('ExportMobileSettingsService', () => {
  let service: ExportMobileSettingsService;

  const mockUser: User = {
    login: 'testUser',
    portfolios: []
  };

  const mockTerminalSettings: TerminalSettings = {
    language: 'ru'
  };

  const mockWidgetSettings: [string, WidgetSettings][] = [
    [GuidGenerator.newGuid(), {
      guid: GuidGenerator.newGuid()
    }]
  ];

  const mockDashboard: Dashboard = {
    guid: GuidGenerator.newGuid(),
    instrumentsSelection: {},
    items: [],
    title: 'Title',
    version: '1'
  };

  const mockInstrumentsHistory: InstrumentKey[] = [
    {symbol: 'AAPL', exchange: 'NASDAQ', instrumentGroup: 'Stocks'}
  ];

  beforeEach(async () => {
    // Reset all mocks before each test
    MockReset();

    // Setup mock for LocalStorageService using MockInstance
    MockInstance(LocalStorageService, 'getItem', (key: string): any => {
      switch (key) {
        case LocalStorageMobileConstants.TerminalSettingsStorageKey:
          return mockTerminalSettings;
        case LocalStorageMobileConstants.WidgetsSettingsStorageKey:
          return mockWidgetSettings;
        case LocalStorageMobileConstants.DashboardsSettingsStorageKey:
          return mockDashboard;
        case LocalStorageMobileConstants.InstrumentsHistoryStorageKey:
          return mockInstrumentsHistory;
        default:
          return null;
      }
    });

    // Build the testing module using MockBuilder
    await MockBuilder(ExportMobileSettingsService)
      .provide(
        MockProvider(
          USER_CONTEXT, {
            getUser: () => of(mockUser)
          })
      )
      .provide(
        MockProvider(LocalStorageService)
      );

    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2024-12-11T16:10:35+05:00'));

    service = TestBed.inject(ExportMobileSettingsService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    MockInstance(LocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export settings to file with correct format and filename', (done) => {
    const expectedTimestamp = Date.now();
    const expectedFilename = `ASTRAS_MOBILE_${expectedTimestamp}`;
    const expectedContent = {
      login: mockUser.login,
      terminalSettings: mockTerminalSettings,
      widgetSettings: mockWidgetSettings,
      dashboardSettings: mockDashboard,
      instrumentsHistory: mockInstrumentsHistory
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
});
