import {Provider} from '@angular/core';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {TimezoneConverterService} from '@terminal-core-lib/features/timezones/services/timezone-converter.service';
import {TimezoneConverter} from '@terminal-core-lib/features/timezones/utils/timezone-converter';
import {TimezoneDisplayOption} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';

export interface TimezoneConverterServiceMock {
  getConverter: ReturnType<typeof vi.fn>;
}

export interface TimezoneConverterServiceMockResult {
  service: TimezoneConverterServiceMock;
  provider: Provider;
}

export class TimezoneConverterServiceMockFactory {
  static create(): TimezoneConverterServiceMockResult {
    const service: TimezoneConverterServiceMock = {
      getConverter: vi.fn().mockReturnValue(of(new TimezoneConverter(TimezoneDisplayOption.LocalTime)))
    };

    return {
      service,
      provider: {provide: TimezoneConverterService, useValue: service}
    };
  }
}
