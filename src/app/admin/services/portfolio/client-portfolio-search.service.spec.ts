import { TestBed } from '@angular/core/testing';

import { ClientPortfolioSearchService } from './client-portfolio-search.service';

describe('ClientPortfolioSearchService', () => {
  let service: ClientPortfolioSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientPortfolioSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
