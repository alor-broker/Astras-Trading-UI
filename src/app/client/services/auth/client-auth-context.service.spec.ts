import { TestBed } from '@angular/core/testing';

import { ClientAuthContextService } from './client-auth-context.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { NEVER } from "rxjs";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { LocalStorageService } from "../../../shared/services/local-storage.service";

describe('ClientAuthContextService', () => {
  let service: ClientAuthContextService;

  beforeEach(() => {
    TestBed.configureTestingModule(
      {
        providers: [
          ClientAuthContextService,
          {
            provide: EnvironmentService,
            useValue: {
              clientDataUrl: '',
              ssoUrl: ''
            }
          },
          {
            provide: LocalStorageService,
            useValue: {
              removeItem: jasmine.createSpy('removeItem').and.callThrough(),
              onOuterChange: jasmine.createSpy('onOuterChange').and.returnValue(NEVER),
              setItem: jasmine.createSpy('setItem').and.callThrough(),
              getItem: jasmine.createSpy('getItem').and.returnValue(null),
            }
          },
          {
            provide: Window,
            useValue: {
              location: {
                assign: jasmine.createSpy('assign').and.callThrough()
              }
            }
          },
          provideHttpClient(),
          provideHttpClientTesting()
        ]
      });
    service = TestBed.inject(ClientAuthContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
