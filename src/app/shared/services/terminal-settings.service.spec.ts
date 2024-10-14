import { TestBed } from '@angular/core/testing';

import { TerminalSettingsService } from './terminal-settings.service';
import { AtsStoreModule } from "../../store/ats-store.module";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { commonTestProviders } from "../utils/testing/common-test-providers";

describe('TerminalSettingsService', () => {
  let service: TerminalSettingsService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        AtsStoreModule
      ],
      providers: [
        TerminalSettingsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: Window, useValue: window},
        ...commonTestProviders
      ]
    });
    service = TestBed.inject(TerminalSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
