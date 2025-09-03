import { TestBed } from '@angular/core/testing';

import { GraphTemplatesStorageService } from './graph-templates-storage.service';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe('GraphTemplatesStorageService', () => {
  let service: GraphTemplatesStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(GraphTemplatesStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
