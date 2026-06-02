import {TestBed} from '@angular/core/testing';
import {firstValueFrom} from 'rxjs';
import {TerminalSettingsServiceMock} from '@testing-lib/angular/terminal-settings-service.mock';
import {TimezoneConverterService} from './timezone-converter.service';
import {TimezoneConverter} from '../utils/timezone-converter';
import {TimezoneDisplayOption} from '../../terminal-settings/terminal-settings.types';

describe('TimezoneConverterService', () => {
  let service: TimezoneConverterService;

  function setup(settings: {timezoneDisplayOption?: TimezoneDisplayOption}): void {
    TestBed.configureTestingModule({
      providers: [
        TimezoneConverterService,
        TerminalSettingsServiceMock.create(settings).provider
      ]
    });

    service = TestBed.inject(TimezoneConverterService);
  }

  it('should build a converter using the configured timezone option', async () => {
    setup({timezoneDisplayOption: TimezoneDisplayOption.LocalTime});

    const converter = await firstValueFrom(service.getConverter());

    expect(converter).toBeInstanceOf(TimezoneConverter);
    expect(converter.displayTimezone).toBe(TimezoneDisplayOption.LocalTime);
  });

  it('should default to Moscow time when no option is configured', async () => {
    setup({});

    const converter = await firstValueFrom(service.getConverter());

    expect(converter.displayTimezone).toBe(TimezoneDisplayOption.MskTime);
  });
});
