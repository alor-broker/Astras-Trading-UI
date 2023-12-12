import { TestBed } from '@angular/core/testing';

import { NewsService } from './news.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import {
  commonTestProviders,
  sharedModuleImportForTests
} from "../../../shared/utils/testing";
import { EnvironmentService } from "../../../shared/services/environment.service";

describe('NewsService', () => {
  let service: NewsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ...sharedModuleImportForTests],
      providers: [
        {
          provide: EnvironmentService,
          useValue: {
            apiUrl: ''
          }
        },
        ...commonTestProviders
      ]
    });
    service = TestBed.inject(NewsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
