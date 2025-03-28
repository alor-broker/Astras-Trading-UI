import { TestBed } from '@angular/core/testing';

import { NewsService } from './news.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
  provideHttpClient,
} from '@angular/common/http';
import {EnvironmentService} from "./environment.service";
import {commonTestProviders} from "../utils/testing/common-test-providers";

describe('NewsService', () => {
  let service: NewsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EnvironmentService,
          useValue: {
            apiUrl: ''
          }
        },
        ...commonTestProviders,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(NewsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
