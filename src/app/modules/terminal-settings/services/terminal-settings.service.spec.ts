import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TerminalSettingsService } from './terminal-settings.service';

describe('TerminalSettingsService', () => {
  let service: TerminalSettingsService;
  const spyAuth = jasmine.createSpyObj('AuthService', ['logout']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        { provide: TerminalSettingsService, useValue: spyAuth }
      ]
    });
    service = TestBed.inject(TerminalSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
