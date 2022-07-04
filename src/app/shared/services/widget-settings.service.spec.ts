import { TestBed } from '@angular/core/testing';
import { WidgetSettingsService } from './widget-settings.service';
import { sharedModuleImportForTests } from "../utils/testing";

describe('WidgetSettingsService', () => {
  let service: WidgetSettingsService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers: [
        WidgetSettingsService
      ],
    });

    service = TestBed.inject(WidgetSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

