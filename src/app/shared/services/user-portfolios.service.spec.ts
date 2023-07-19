import { TestBed } from '@angular/core/testing';

import { UserPortfoliosService } from './user-portfolios.service';
import {commonTestProviders, sharedModuleImportForTests} from "../utils/testing";

describe('UserPortfoliosService', () => {
  let service: UserPortfoliosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[...sharedModuleImportForTests],
      providers: [...commonTestProviders]
    });
    service = TestBed.inject(UserPortfoliosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
