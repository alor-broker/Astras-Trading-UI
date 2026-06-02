import {vi} from 'vitest';
import {of} from 'rxjs';
import {Provider} from '@angular/core';
import {TerminalSettingsService} from '@terminal-core-lib/features/terminal-settings/services/terminal-settings.service';
import {TerminalSettings} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';

export interface TerminalSettingsServiceMockResult {
  getSettings: ReturnType<typeof vi.fn>;
  /** Ready-to-use TestBed provider that injects this mock for {@link TerminalSettingsService}. */
  provider: Provider;
}

export class TerminalSettingsServiceMock {
  /**
   * Creates a {@link TerminalSettingsService} test double whose `getSettings()` emits the
   * provided (partial) settings once. Use `mock.provider` in `TestBed.configureTestingModule`.
   */
  static create(settings: Partial<TerminalSettings> = {}): TerminalSettingsServiceMockResult {
    const getSettings = vi.fn().mockReturnValue(of(settings));

    return {
      getSettings,
      provider: {provide: TerminalSettingsService, useValue: {getSettings}}
    };
  }
}
