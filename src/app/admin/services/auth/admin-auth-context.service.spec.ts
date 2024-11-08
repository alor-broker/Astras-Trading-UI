import { TestBed } from '@angular/core/testing';

import { AdminAuthContextService } from './admin-auth-context.service';
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { ApiTokenProviderService } from "../../../shared/services/auth/api-token-provider.service";
import { AdminIdentityService } from "../identity/admin-identity.service";
import { NEVER } from "rxjs";

describe('AdminAuthContextService', () => {
  let service: AdminAuthContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: LocalStorageService,
          useValue: {
            removeItem: jasmine.createSpy('removeItem').and.callThrough(),
            setItem: jasmine.createSpy('setItem').and.callThrough(),
            getItem: jasmine.createSpy('getItem').and.returnValue(null)
          }
        },
        {
          provide: ApiTokenProviderService,
          useValue: {
            clearToken: jasmine.createSpy('clearToken').and.callThrough(),
            updateTokenState: jasmine.createSpy('updateTokenState').and.callThrough()
          }
        },
        {
          provide: AdminIdentityService,
          useValue: {
            refresh: jasmine.createSpy('refresh').and.returnValue(NEVER)
          }
        }
      ]
    });
    service = TestBed.inject(AdminAuthContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
