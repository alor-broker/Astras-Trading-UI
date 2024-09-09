import { TestBed } from '@angular/core/testing';

import { AdminIdentityService } from './admin-identity.service';
import {
  provideHttpClient,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe('AdminIdentityService', () => {
  let service: AdminIdentityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers:[
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AdminIdentityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
