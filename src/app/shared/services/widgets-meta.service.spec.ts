import { TestBed } from '@angular/core/testing';

import { WidgetsMetaService } from './widgets-meta.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('WidgetsMetaService', () => {
  let service: WidgetsMetaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(WidgetsMetaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
