import { TestBed } from '@angular/core/testing';
import { WidgetSettingsService } from './widget-settings.service';
import {
  commonTestProviders,
  sharedModuleImportForTests
} from "../utils/testing";
import { LoggerService } from './logging/logger.service';

describe('WidgetSettingsService', () => {
  let service: WidgetSettingsService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
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

