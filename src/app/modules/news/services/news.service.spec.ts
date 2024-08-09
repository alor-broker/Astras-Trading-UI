import { TestBed } from '@angular/core/testing';

import { NewsService } from './news.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
  commonTestProviders,
  sharedModuleImportForTests
} from "../../../shared/utils/testing";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('NewsService', () => {
  let service: NewsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [...sharedModuleImportForTests],
    providers: [
        {
            provide: EnvironmentService,
            useValue: {
                apiUrl: ''
            }
        },
        ...commonTestProviders,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
    service = TestBed.inject(NewsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
