import { TestBed } from '@angular/core/testing';

import { ClientPortfolioSearchService } from './client-portfolio-search.service';
import {MockProvider} from "ng-mocks";
import {EnvironmentService} from "../../../shared/services/environment.service";
import {provideHttpClient} from "@angular/common/http";
import {provideHttpClientTesting} from "@angular/common/http/testing";

describe('ClientPortfolioSearchService', () => {
  let service: ClientPortfolioSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers:[
        MockProvider(
          EnvironmentService,
          {
            apiUrl: ''
          }
        ),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ClientPortfolioSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
