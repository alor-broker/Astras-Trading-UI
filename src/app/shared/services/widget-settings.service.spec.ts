import { TestBed } from '@angular/core/testing';
import { WidgetSettingsService } from './widget-settings.service';
import {
  getTranslocoModule,
  sharedModuleImportForTests
} from "../utils/testing";
import { LoggerService } from './logging/logger.service';

describe('WidgetSettingsService', () => {
  let service: WidgetSettingsService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests,
        getTranslocoModule()
      ],
      providers: [
        WidgetSettingsService,
        {
          provide: LoggerService,
          useValue: {
            warn: jasmine.createSpy('warn').and.callThrough()
          }
        }
      ],
    });

    service = TestBed.inject(WidgetSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
